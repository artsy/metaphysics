import { OfferMutationInputType } from "./types/offer_mutation_input_type"
import { OrderOrFailureUnionType } from "./types/order_or_error_union"
import { mutationWithClientMutationId } from "graphql-relay"
import gql from "lib/gql"
import { BuyerOrderFields } from "./query_helpers"
import { graphql } from "graphql"
import { extractEcommerceResponse } from "./extractEcommerceResponse"

export const BuyerRejectOfferMutation = mutationWithClientMutationId({
  name: "buyerRejectOffer",
  description: "Buyer rejects a submitted offer from seller",
  inputFields: OfferMutationInputType.getFields(),
  outputFields: {
    orderOrError: {
      type: OrderOrFailureUnionType,
    },
  },
  mutateAndGetPayload: (
    { offerId },
    context,
    { rootValue: { accessToken, exchangeSchema } }
  ) => {
    if (!accessToken) {
      return new Error("You need to be signed in to perform this action")
    }
    const mutation = gql`
      mutation buyerRejectOffer($offerId: ID!) {
        ecommerceBuyerRejectOffer(input: { offerId: $offerId }) {
          orderOrError {
            __typename
            ... on EcommerceOrderWithMutationSuccess {
              order {
                ${BuyerOrderFields}
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
    }).then(extractEcommerceResponse("ecommerceBuyerRejectOffer"))
  },
})
