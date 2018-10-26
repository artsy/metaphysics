import { graphql } from "graphql"
import { OrderMutationInputType } from "schema/ecommerce/types/order_mutation_input"
import { mutationWithClientMutationId } from "graphql-relay"
import {
  RequestedFulfillmentFragment,
  BuyerSellerFields,
} from "./query_helpers"
import gql from "lib/gql"
import { OrderOrFailureUnionType } from "./types/order_or_error_union"
import { extractEcommerceResponse } from "./extractEcommerceResponse"

export const ConfirmPickupMutation = mutationWithClientMutationId({
  name: "ConfirmPickup",
  description: "Confirms pickup for an ecommerce order",
  inputFields: OrderMutationInputType.getFields(),
  outputFields: {
    orderOrError: {
      type: OrderOrFailureUnionType,
    },
  },
  mutateAndGetPayload: (
    { orderId },
    context,
    { rootValue: { accessToken, exchangeSchema } }
  ) => {
    if (!accessToken) {
      return new Error("You need to be signed in to perform this action")
    }
    const mutation = gql`
      mutation confirmPickup($orderId: ID!) {
        ecommerceConfirmPickup(input: {
          id: $orderId,
        }) {
          orderOrError {
            __typename
            ... on EcommerceOrderWithMutationSuccess {
              order {
                id
                mode
                code
                currencyCode
                state
                stateReason
                ${BuyerSellerFields}
                ${RequestedFulfillmentFragment}
                itemsTotalCents
                buyerPhoneNumber
                shippingTotalCents
                taxTotalCents
                commissionFeeCents
                commissionRate
                displayCommissionRate
                transactionFeeCents
                buyerTotalCents
                sellerTotalCents
                updatedAt
                createdAt
                stateUpdatedAt
                stateExpiresAt
                lastApprovedAt
                lastSubmittedAt
                lineItems{
                  edges{
                    node{
                      id
                      priceCents
                      artworkId
                      editionSetId
                      quantity
                    }
                  }
                }
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
      orderId,
    }).then(extractEcommerceResponse("ecommerceConfirmPickup"))
  },
})
