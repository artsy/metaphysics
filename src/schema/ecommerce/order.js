import { graphql, GraphQLNonNull, GraphQLString } from "graphql"
import { OrderType } from "schema/ecommerce/types/order"
export const Order = {
  name: "Order",
  type: OrderType,
  description: "Returns a single Order",
  args: { id: { type: new GraphQLNonNull(GraphQLString) } },
  resolve: (_parent, { id }, context, { rootValue: { stressSchema } }) => {
    const query = `
      query EcommerceOrder($id: ID!) {
        ecommerce_order(id: $id) {
          id
          code
          currencyCode
          state
          partnerId
          userId
          updatedAt
          createdAt
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
    `
    return graphql(stressSchema, query, null, context, {
      id,
    }).then(result => (result.data ? result.data.ecommerce_order : null))
  },
}
