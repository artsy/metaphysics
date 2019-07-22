import {
  graphql,
  GraphQLNonNull,
  GraphQLString,
  GraphQLInputObjectType,
} from "graphql"
import { mutationWithClientMutationId } from "graphql-relay"
import { OrderOrFailureUnionType } from "./types/order_or_error_union"
import { SellerOrderFields } from "./query_helpers"
import gql from "lib/gql"
import { extractEcommerceResponse } from "./extractEcommerceResponse"
import { MoneyInput } from "schema/v1/fields/money"
import { moneyFieldToUnit } from "lib/moneyHelper"
import { ResolverContext } from "types/graphql"

const SellerCounterOfferMutationInputType = new GraphQLInputObjectType({
  name: "OfferMutationInput",
  fields: {
    offerId: {
      type: new GraphQLNonNull(GraphQLString),
      description: "The ID of the offer to counter",
    },
    offerPrice: {
      type: MoneyInput,
      description: "Offer price",
    },
    note: {
      type: GraphQLString,
      description: "Offer note",
    },
  },
})

export const SellerCounterOfferMutation = mutationWithClientMutationId<
  any,
  any,
  ResolverContext
>({
  name: "sellerCounterOffer",
  description: "Seller counters buyers offer",
  inputFields: SellerCounterOfferMutationInputType.getFields(),
  outputFields: {
    orderOrError: {
      type: OrderOrFailureUnionType,
    },
  },
  mutateAndGetPayload: ({ offerId, offerPrice, note }, context) => {
    const { accessToken, exchangeSchema } = context
    if (!accessToken) {
      return new Error("You need to be signed in to perform this action")
    }
    const mutation = gql`
      mutation sellerCounterOffer($offerId: ID!, $amountCents: Int!, $note: String) {
        ecommerceSellerCounterOffer(input: {
          offerId: $offerId,
          amountCents: $amountCents,
          note: $note
        }) {
          orderOrError {
            __typename
            ... on EcommerceOrderWithMutationSuccess {
              order {
                ${SellerOrderFields}
              }
            }
            ... on EcommerceOrderWithMutationFailure {
              error {
                type
                code
                data
              }
            }
          }
        }
      }
    `
    return graphql(exchangeSchema, mutation, null, context, {
      offerId,
      amountCents: moneyFieldToUnit(offerPrice),
      note,
    }).then(extractEcommerceResponse("ecommerceSellerCounterOffer"))
  },
})
