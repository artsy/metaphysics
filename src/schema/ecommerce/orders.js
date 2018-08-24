import { graphql, GraphQLString } from "graphql"
import { OrderConnection } from "schema/ecommerce/types/order"
import { OrdersSortMethodTypeEnum } from "schema/ecommerce/types/orders_sort_method_enum"
import gql from "lib/gql"
import { RequestedFulfillmentFragment } from "./types/requested_fulfillment_union_type"

export const Orders = {
  name: "Orders",
  type: OrderConnection,
  description: "Returns list of orders",
  args: {
    userId: { type: GraphQLString },
    partnerId: { type: GraphQLString },
    state: { type: GraphQLString },
    sort: { type: OrdersSortMethodTypeEnum },
  },
  resolve: (
    _parent,
    { userId, partnerId, state, sort },
    context,
    { rootValue: { exchangeSchema } }
  ) => {
    const query = gql`
      query EcommerceOrders(
        $userId: String
        $partnerId: String
        $state: EcommerceOrderStateEnum
        $sort: EcommerceOrderConnectionSortEnum
      ) {
        ecommerce_orders(
          userId: $userId
          partnerId: $partnerId
          state: $state
          sort: $sort
        ) {
          edges {
            node {
              id
              code
              currencyCode
              state
              partnerId
              userId
              updatedAt
              createdAt
              requestedFulfillment {
                ${RequestedFulfillmentFragment}
              }
              itemsTotalCents
              shippingTotalCents
              taxTotalCents
              commissionFeeCents
              transactionFeeCents
              buyerTotalCents
              sellerTotalCents
              stateUpdatedAt
              stateExpiresAt
              lineItems {
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
      userId,
      partnerId,
      state,
      sort,
    }).then(result => {
      if (result.errors) {
        throw Error(result.errors.map(d => d.message))
      }
      return result.data.ecommerce_orders
    })
  },
}
