import { graphql, GraphQLNonNull, GraphQLString } from "graphql"
import { OrderType } from "schema/ecommerce/types/order"
import {
  RequestedFulfillmentFragment,
  BuyerSellerFields,
} from "./query_helpers"
import gql from "lib/gql"
import { extractEcommerceResponse } from "./extractEcommerceResponse"

export const Order = {
  name: "Order",
  type: OrderType,
  description: "Returns a single Order",
  args: { id: { type: new GraphQLNonNull(GraphQLString) } },
  resolve: (_parent, { id }, context, { rootValue: { exchangeSchema } }) => {
    const query = gql`
      query EcommerceOrder($id: ID!) {
        ecommerceOrder(id: $id) {
          id
          code
          currencyCode
          state
          stateReason
          ${BuyerSellerFields}
          creditCardId
          ${RequestedFulfillmentFragment}
          itemsTotalCents
          shippingTotalCents
          taxTotalCents
          commissionFeeCents
          transactionFeeCents
          buyerPhoneNumber
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
                fulfillments{
                  edges{
                    node{
                      id
                      courier
                      trackingId
                      estimatedDelivery
                    }
                  }
                }
              }
            }
          }
        }
      }
    `
    return graphql(exchangeSchema, query, null, context, {
      id,
    }).then(extractEcommerceResponse("ecommerceOrder"))
  },
}
