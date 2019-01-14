import { GraphQLSchema } from "graphql"
import { amountSDL, amount } from "schema/fields/money"
import gql from "lib/gql"

export const exchangeStitchingEnvironment = (
  localSchema: GraphQLSchema,
  exchangeSchema: GraphQLSchema
) => {
  const totals = [
    "itemsTotal",
    "sellerTotal",
    "buyerTotal",
    "taxTotal",
    "shippingTotal",
    "transactionFee",
  ]
  const totalsSDL = totals.map(amountSDL)

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

  const buyerParty = {
    // bit of a magic in next line, when adding fragment, it seems
    // all second level fields are ignored, so __typename and id
    // couldn't be added, so the hack was to alias the fragment field
    // and that gets the current fields
    fragment: aliasedPartyFragment("buyer", "buyerParty"),
    resolve: (parent, _args, context, info) => {
      const typename = parent.buyerParty.__typename
      const id = parent.buyerParty.id
      return info.mergeInfo
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
        .then(response => {
          // Response coming from resolver is in "CommerceUser" type
          // but we expect "User", we have to manually replace it
          response.__typename = response.__typename.replace("Commerce", "")
          return response
        })
    },
  }

  const sellerParty = {
    fragment: aliasedPartyFragment("seller", "sellerParty"),
    resolve: (parent, _args, context, info) => {
      const typename = parent.sellerParty.__typename
      const id = parent.sellerParty.id
      return info.mergeInfo
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
        .then(response => {
          // Response coming from resolver is in "CommerceUser" type
          // but we expect "User", we have to manually replace it
          response.__typename = response.__typename.replace("Commerce", "")
          return response
        })
    },
  }

  // Map the totals to a set of resolvers that call the amount function
  // the type param is only used for the fragment name
  const totalsResolvers = type =>
    totals.map(name => ({
      [name]: {
        fragment: `fragment ${type}_${name} on ${type} { ${name} }`,
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
    }

    extend type CommerceBuyOrder {
      buyerParty: OrderParty
      sellerParty: OrderParty

      ${totalsSDL.join("\n")}
    }

    extend type CommerceOfferOrder {
      buyerParty: OrderParty
      sellerParty: OrderParty

      ${totalsSDL.join("\n")}
      ${amountSDL("offerTotal")}
    }

    extend interface CommerceOrder {
      buyerParty: OrderParty
      sellerParty: OrderParty

      ${totalsSDL.join("\n")}
    }
  `,

    // Resolvers for the above
    resolvers: {
      CommerceBuyOrder: {
        // The money helper resolvers
        ...reduceToResolvers(totalsResolvers("CommerceBuyOrder")),
        buyerParty: buyerParty,
        sellerParty: sellerParty,
      },
      CommerceOfferOrder: {
        ...reduceToResolvers(totalsResolvers("CommerceOfferOrder")),
        buyerParty: buyerParty,
        sellerParty: sellerParty,
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
      },
    },
  }
}
