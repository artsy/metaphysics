import { graphql, GraphQLString } from "graphql"
import { OrderConnection } from "schema/ecommerce/types/order"
import { OrdersSortMethodTypeEnum } from "schema/ecommerce/types/orders_sort_method_enum"
import gql from "lib/gql"
import {
  PageInfo,
  RequestedFulfillmentFragment,
  BuyerSellerFields,
} from "./query_helpers"
import { extractEcommerceResponse } from "./extractEcommerceResponse"

export const Orders = {
  name: "Orders",
  type: OrderConnection,
  description: "Returns list of orders",
  args: {
    buyerId: { type: GraphQLString },
    buyerType: { type: GraphQLString },
    sellerId: { type: GraphQLString },
    sellerType: { type: GraphQLString },
    state: { type: GraphQLString },
    sort: { type: OrdersSortMethodTypeEnum },
  },
  resolve: (
    _parent,
    { sellerId, sellerType, buyerId, buyerType, state, sort },
    context,
    { rootValue: { exchangeSchema } }
  ) => {
    const query = gql`
      query EcommerceOrders(
        $buyerId: String
        $buyerType: String
        $sellerId: String
        $sellerType: String
        $state: EcommerceOrderStateEnum
        $sort: EcommerceOrderConnectionSortEnum
      ) {
        ecommerce_orders(
          buyerId: $buyerId
          buyerType: $buyerType
          sellerId: $sellerId
          sellerType: $sellerType
          state: $state
          sort: $sort
        ) {
          ${PageInfo}
          totalCount
          edges {
            node {
              id
              code
              currencyCode
              state
              ${BuyerSellerFields}
              updatedAt
              createdAt
              ${RequestedFulfillmentFragment}
              itemsTotalCents
              shippingTotalCents
              taxTotalCents
              commissionFeeCents
              transactionFeeCents
              buyerPhoneNumber
              buyerTotalCents
              sellerTotalCents
              stateUpdatedAt
              stateExpiresAt
              lastApprovedAt
              lastSubmittedAt
              lineItems {
                ${PageInfo}
                edges {
                  node {
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
        }
      }
    `
    return graphql(exchangeSchema, query, null, context, {
      buyerId,
      buyerType,
      sellerId,
      sellerType,
      state,
      sort,
    }).then(extractEcommerceResponse("ecommerce_orders"))
  },
}
