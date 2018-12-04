import { graphql } from "graphql"
import { mutationWithClientMutationId } from "graphql-relay"
import { OfferMutationInputType } from "schema/ecommerce/types/offer_mutation_input_type"
import { OrderOrFailureUnionType } from "./types/order_or_error_union"
import { SellerOrderFields } from "./query_helpers"
import gql from "lib/gql"
import { extractEcommerceResponse } from "./extractEcommerceResponse"

export const BuyerAcceptOfferMutation = mutationWithClientMutationId({
  name: "buyerAcceptOffer",
  description: "Buyer accepts a submitted offer from seller",
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
      mutation buyerAcceptOffer($offerId: ID!) {
        ecommerceBuyerAcceptOffer(input: {
          offerId: $offerId,
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
    }).then(extractEcommerceResponse("ecommerceBuyerAcceptOffer"))
  },
})
