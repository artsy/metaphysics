import {
  graphql,
  GraphQLNonNull,
  GraphQLString,
  GraphQLFieldConfig,
} from "graphql"
import { OrderInterface } from "schema/v1/ecommerce/types/order"
import { AllOrderFields } from "./query_helpers"
import gql from "lib/gql"
import { extractEcommerceResponse } from "./extractEcommerceResponse"
import { ResolverContext } from "types/graphql"

export const Order: GraphQLFieldConfig<void, ResolverContext> = {
  type: OrderInterface,
  description: "Returns a single Order",
  args: { id: { type: new GraphQLNonNull(GraphQLString) } },
  resolve: (_parent, { id }, context) => {
    const query = gql`
      query EcommerceOrder($id: ID, $code: String) {
        ecommerceOrder(id: $id, code: $code) {
          ${AllOrderFields}
          lineItems{
            edges{
              node{
                __typename
                id
                priceCents
                artworkId
                artworkVersionId
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
    return graphql(context.exchangeSchema, query, null, context, {
      id,
    }).then(extractEcommerceResponse("ecommerceOrder"))
  },
}
