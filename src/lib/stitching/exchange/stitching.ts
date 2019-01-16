import { GraphQLSchema } from "graphql"
import { amountSDL, amount } from "schema/fields/money"
import gql from "lib/gql"

const orderTotals = [
  "itemsTotal",
  "sellerTotal",
  "buyerTotal",
  "taxTotal",
  "shippingTotal",
  "transactionFee",
]
const orderTotalsSDL = orderTotals.map(amountSDL)

const lineItemTotals = ["shippingTotal", "listPrice", "commissionFee"]
const lineItemTotalsSDL = lineItemTotals.map(amountSDL)

const offerAmountFields = ["amount", "taxTotal", "shippingTotal", "buyerTotal"]
const offerAmountFieldsSDL = offerAmountFields.map(amountSDL)
export const exchangeStitchingEnvironment = (
  localSchema: GraphQLSchema,
  exchangeSchema: GraphQLSchema
) => {
  const aliasedPartyFragment = (field, alias) => {
    return gql`
    ... on CommerceOrder {
      ${alias}: ${field} {
        __typename
        ... on CommerceUser {
          __typename
          id
        }
        ... on CommercePartner {
          __typename
          id
        }
      }
    }`
  }

  type DetailsFactoryInput = { from: string; to: string }

  /**
   * This returns a resolver which can take an exchange OrderParty union
   * and convert it into a metaphysics `OrderParty`.
   *
   * You pass in the field to get the details from, and and the new fieldName
   */
  const partyUnionToDetailsFactory = ({ from, to }: DetailsFactoryInput) => {
    return {
      // Bit of a magic in next line, when adding fragment, it seems
      // all second level fields are ignored, so __typename and id
      // couldn't be added, so the hack was to alias the fragment field
      // and that gets the current fields
      fragment: aliasedPartyFragment(from, to),
      resolve: (parent, _args, context, info) => {
        const typename = parent[to].__typename
        const id = parent[to].id

        // Make a call to the user or partner resolver on query to
        // grab our Metaphysics representations
        return (
          info.mergeInfo
            .delegateToSchema({
              schema: localSchema,
              operation: "query",
              fieldName: typename === "CommerceUser" ? "user" : "partner",
              args: {
                id,
              },
              context,
              info,
              transforms: (exchangeSchema as any).transforms,
            })
            // Re-jigger the type systems back into place, as right now
            // it is considered a CommerceUser and clients will reject it.
            .then(response => {
              response.__typename =
                typename === "CommerceUser" ? "User" : "Partner"
              return response
            })
        )
      },
    }
  }

  const buyerDetailsResolver = partyUnionToDetailsFactory({
    from: "buyer",
    to: "buyerDetails",
  })
  const sellerDetailsResolver = partyUnionToDetailsFactory({
    from: "seller",
    to: "sellerDetails",
  })
  const fromDetailsResolver = partyUnionToDetailsFactory({
    from: "from",
    to: "fromDetails",
  })

  // Map the totals array to a set of resolvers that call the amount function
  // the type param is only used for the fragment name
  const totalsResolvers = (type, totalSDLS) =>
    totalSDLS.map(name => ({
      [name]: {
        fragment: `fragment ${type}_${name} on ${type} { ${name}Cents }`,
        resolve: (parent, args, _context, _info) =>
          amount(_ => parent[name + "Cents"]).resolve({}, args),
      },
    }))

  // Used to convert an array of `key: resolvers` to a single obj
  const reduceToResolvers = arr => arr.reduce((a, b) => ({ ...a, ...b }))

  return {
    // The SDL used to declare how to stitch an object
    extensionSchema: `
    extend type CommerceLineItem {
      artwork: Artwork
      artworkVersion: ArtworkVersion
      ${lineItemTotalsSDL.join("\n")}
    }

    extend type CommerceBuyOrder {
      buyerDetails: OrderParty
      sellerDetails: OrderParty

      ${orderTotalsSDL.join("\n")}
    }

    extend type CommerceOfferOrder {
      buyerDetails: OrderParty
      sellerDetails: OrderParty

      ${orderTotalsSDL.join("\n")}
      ${amountSDL("offerTotal")}
    }

    extend interface CommerceOrder {
      buyerDetails: OrderParty
      sellerDetails: OrderParty

      ${orderTotalsSDL.join("\n")}
    }

    extend type CommerceOffer {
      fromDetails: OrderParty
      ${offerAmountFieldsSDL.join("\n")}
    }
  `,

    // Resolvers for the above
    resolvers: {
      CommerceBuyOrder: {
        // The money helper resolvers
        ...reduceToResolvers(totalsResolvers("CommerceBuyOrder", orderTotals)),
        buyerDetails: buyerDetailsResolver,
        sellerDetails: sellerDetailsResolver,
      },
      CommerceOfferOrder: {
        ...reduceToResolvers(
          totalsResolvers("CommerceOfferOrder", orderTotals)
        ),
        buyerDetails: buyerDetailsResolver,
        sellerDetails: sellerDetailsResolver,
      },
      CommerceLineItem: {
        artwork: {
          // Todo: in the future we may want to use the `artworkVersionId` also
          fragment: `fragment CommerceLineItemArtwork on CommerceLineItem { artworkId }`,
          resolve: (parent, _args, context, info) => {
            const id = parent.artworkId
            return info.mergeInfo.delegateToSchema({
              schema: localSchema,
              operation: "query",
              fieldName: "artwork",
              args: {
                id,
              },
              context,
              info,
              transforms: (exchangeSchema as any).transforms,
            })
          },
        },
        artworkVersion: {
          // Todo: in the future we may want to use the `artworkVersionId` also
          fragment: `fragment CommerceLineItemArtwork on CommerceLineItem { artworkVersionId }`,
          resolve: (parent, _args, context, info) => {
            const id = parent.artworkVersionId
            return info.mergeInfo.delegateToSchema({
              schema: localSchema,
              operation: "query",
              fieldName: "artworkVersion",
              args: {
                id,
              },
              context,
              info,
              transforms: (exchangeSchema as any).transforms,
            })
          },
        },
        ...reduceToResolvers(
          totalsResolvers("CommerceLineItem", lineItemTotals)
        ),
      },
      CommerceOffer: {
        ...reduceToResolvers(
          totalsResolvers("CommerceOffer", offerAmountFields)
        ),
        fromDetails: fromDetailsResolver,
      },
    },
  }
}
