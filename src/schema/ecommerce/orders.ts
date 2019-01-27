import { pageable } from "relay-cursor-paging"
import { graphql, GraphQLString } from "graphql"
import { OrderConnection } from "schema/ecommerce/types/order"
import { OrdersSortMethodTypeEnum } from "schema/ecommerce/types/enums/orders_sort_method_enum"
import gql from "lib/gql"
import { PageInfo, AllOrderFields } from "./query_helpers"
import { extractEcommerceResponse } from "./extractEcommerceResponse"
import { OrderModeEnum } from "./types/enums/order_mode_enum"

export const Orders = {
  name: "Orders",
  type: OrderConnection,
  description: "Returns list of orders",
  args: pageable({
    buyerId: { type: GraphQLString },
    buyerType: { type: GraphQLString },
    sellerId: { type: GraphQLString },
    sellerType: { type: GraphQLString },
    mode: { type: OrderModeEnum },
    state: { type: GraphQLString },
    sort: { type: OrdersSortMethodTypeEnum },
  }),
  resolve: (
    _parent,
    {
      sellerId,
      sellerType,
      buyerId,
      buyerType,
      mode,
      state,
      sort,
      first,
      after,
      last,
      before,
    },
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
        $mode: EcommerceOrderModeEnum
        $sort: EcommerceOrderConnectionSortEnum
        $after: String
        $first: Int
        $before: String
        $last: Int
      ) {
        ecommerceOrders(
          buyerId: $buyerId
          buyerType: $buyerType
          sellerId: $sellerId
          sellerType: $sellerType
          mode: $mode
          state: $state
          sort: $sort
          after: $after
          first: $first
          before: $before
          last: $last
        ) {
          ${PageInfo}
          totalPages
          totalCount
          edges {
            cursor
            node {
              ${AllOrderFields}
              lineItems {
                ${PageInfo}
                edges {
                  node {
                    id
                    priceCents
                    artworkId
                    artworkVersionId
                    editionSetId
                    quantity
                  }
                }
              }
            }
          }
          pageCursors {
            first {
              cursor
              isCurrent
              page
            }
            last {
              cursor
              isCurrent
              page
            }
            around {
              cursor
              isCurrent
              page
            }
            previous {
              cursor
              isCurrent
              page
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
      mode,
      state,
      sort,
      first,
      after,
      last,
      before,
    }).then(extractEcommerceResponse("ecommerceOrders"))
  },
}
