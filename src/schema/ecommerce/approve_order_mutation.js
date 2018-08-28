import { graphql } from "graphql"
import { OrderReturnType } from "schema/ecommerce/types/order_return"
import { OrderMutationInputType } from "schema/ecommerce/types/order_mutation_input"
import { mutationWithClientMutationId } from "graphql-relay"
import {
  RequestedFulfillmentFragment,
  BuyerSellerFields,
} from "./query_helpers"
import gql from "lib/gql"

export const ApproveOrderMutation = mutationWithClientMutationId({
  name: "ApproveOrder",
  description: "Approves an order with payment",
  inputFields: OrderMutationInputType.getFields(),
  outputFields: {
    result: {
      type: OrderReturnType,
      resolve: order => order,
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
          errors
        }
      }
    `
    return graphql(exchangeSchema, mutation, null, context, {
      orderId,
    }).then(result => {
      if (result.errors) {
        throw Error(result.errors.map(d => d.message))
      }
      const { order, errors } = result.data.ecommerce_approveOrder
      return {
        order,
        errors,
      }
    })
  },
})
