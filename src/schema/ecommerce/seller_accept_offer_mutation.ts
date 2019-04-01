import { graphql } from "graphql"
import { mutationWithClientMutationId } from "graphql-relay"
import { OfferMutationInputType } from "schema/ecommerce/types/offer_mutation_input_type"
import { OrderOrFailureUnionType } from "./types/order_or_error_union"
import { SellerOrderFields } from "./query_helpers"
import gql from "lib/gql"
import { extractEcommerceResponse } from "./extractEcommerceResponse"
import { ResolverContext } from "types/graphql"

export const SellerAcceptOfferMutation = mutationWithClientMutationId<
  any,
  any,
  ResolverContext
>({
  name: "sellerAcceptOffer",
  description: "Approves an order with payment",
  inputFields: OfferMutationInputType.getFields(),
  outputFields: {
    orderOrError: {
      type: OrderOrFailureUnionType,
    },
  },
  mutateAndGetPayload: ({ offerId }, context) => {
    const { accessToken, exchangeSchema } = context
    if (!accessToken) {
      return new Error("You need to be signed in to perform this action")
    }
    const mutation = gql`
      mutation sellerAcceptOffer($offerId: ID!) {
        ecommerceSellerAcceptOffer(input: {
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
    }).then(extractEcommerceResponse("ecommerceSellerAcceptOffer"))
  },
})
