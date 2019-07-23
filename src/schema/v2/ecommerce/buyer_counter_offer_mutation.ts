import {
  graphql,
  GraphQLNonNull,
  GraphQLString,
  GraphQLInputObjectType,
} from "graphql"
import { mutationWithClientMutationId } from "graphql-relay"
import { OrderOrFailureUnionType } from "./types/order_or_error_union"
import { BuyerOrderFields } from "./query_helpers"
import gql from "lib/gql"
import { extractEcommerceResponse } from "./extractEcommerceResponse"
import { MoneyInput } from "schema/v2/fields/money"
import { moneyFieldToUnit } from "lib/moneyHelper"
import { ResolverContext } from "types/graphql"

const BuyerCounterOfferMutationInputType = new GraphQLInputObjectType({
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

export const BuyerCounterOfferMutation = mutationWithClientMutationId<
  any,
  any,
  ResolverContext
>({
  name: "buyerCounterOffer",
  description: "Buyer counters sellers offer",
  inputFields: BuyerCounterOfferMutationInputType.getFields(),
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
      mutation buyerCounterOffer($offerId: ID!, $amountCents: Int!, $note: String) {
        ecommerceBuyerCounterOffer(input: {
          offerId: $offerId,
          amountCents: $amountCents,
          note: $note
        }) {
          orderOrError {
            __typename
            ... on EcommerceOrderWithMutationSuccess {
              order {
                ${BuyerOrderFields}
                creditCardId
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
    }).then(extractEcommerceResponse("ecommerceBuyerCounterOffer"))
  },
})
