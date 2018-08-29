import { graphql } from "graphql"
import { OrderMutationInputType } from "schema/ecommerce/types/order_mutation_input"
import { mutationWithClientMutationId } from "graphql-relay"
import {
  RequestedFulfillmentFragment,
  BuyerSellerFields,
} from "./query_helpers"
import gql from "lib/gql"
import { OrderOrFailureUnionType } from "./types/order_or_error_union"

export const ApproveOrderMutation = mutationWithClientMutationId({
  name: "ApproveOrder",
  description: "Approves an order with payment",
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
      mutation approveOrder($orderId: ID!) {
        ecommerce_approveOrder(input: {
          id: $orderId,
        }) {
          orderOrError {
            ... on EcommerceOrderWithMutationSuccess {
              order {
              id
                code
                currencyCode
                state
                ${BuyerSellerFields}
                ${RequestedFulfillmentFragment}
                itemsTotalCents
                shippingTotalCents
                taxTotalCents
                commissionFeeCents
                transactionFeeCents
                buyerTotalCents
                sellerTotalCents
                updatedAt
                createdAt
                stateUpdatedAt
                stateExpiresAt
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
                description
              }
            }
          }
        }
      }
    `
    return graphql(exchangeSchema, mutation, null, context, {
      orderId,
    }).then(result => result.data!.ecommerce_approveOrder)
  },
})
