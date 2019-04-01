import { graphql } from "graphql"
import { mutationWithClientMutationId } from "graphql-relay"
import { OrderOrFailureUnionType } from "./types/order_or_error_union"
import { SellerOrderFields } from "./query_helpers"
import gql from "lib/gql"
import { extractEcommerceResponse } from "./extractEcommerceResponse"
import { RejectOfferMutationInputType } from "./types/reject_offer_mutation_input_type"
import { ResolverContext } from "types/graphql"

export const SellerRejectOfferMutation = mutationWithClientMutationId<
  any,
  any,
  ResolverContext
>({
  name: "sellerRejectOffer",
  description: "Rejects an offer",
  inputFields: RejectOfferMutationInputType.getFields(),
  outputFields: {
    orderOrError: {
      type: OrderOrFailureUnionType,
    },
  },
  mutateAndGetPayload: ({ offerId, rejectReason }, context) => {
    const { accessToken, exchangeSchema } = context
    if (!accessToken) {
      return new Error("You need to be signed in to perform this action")
    }
    const mutation = gql`
      mutation sellerRejectOffer($offerId: ID!, $rejectReason: EcommerceCancelReasonTypeEnum!) {
        ecommerceSellerRejectOffer(input: {
          offerId: $offerId,
          rejectReason: $rejectReason,
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
      rejectReason,
    }).then(extractEcommerceResponse("ecommerceSellerRejectOffer"))
  },
})
