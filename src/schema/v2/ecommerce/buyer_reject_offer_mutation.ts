import { OrderOrFailureUnionType } from "./types/order_or_error_union"
import { mutationWithClientMutationId } from "graphql-relay"
import gql from "lib/gql"
import { BuyerOrderFields } from "./query_helpers"
import { graphql } from "graphql"
import { extractEcommerceResponse } from "./extractEcommerceResponse"
import { RejectOfferMutationInputType } from "./types/reject_offer_mutation_input_type"
import { ResolverContext } from "types/graphql"

export const BuyerRejectOfferMutation = mutationWithClientMutationId<
  any,
  any,
  ResolverContext
>({
  name: "buyerRejectOffer",
  description: "Buyer rejects a submitted offer from seller",
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
      mutation buyerRejectOffer($offerId: ID!, $rejectReason: EcommerceCancelReasonTypeEnum) {
        ecommerceBuyerRejectOffer(input: { offerId: $offerId, rejectReason: $rejectReason, }) {
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
      rejectReason,
    }).then(extractEcommerceResponse("ecommerceBuyerRejectOffer"))
  },
})
