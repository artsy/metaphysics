import { graphql, GraphQLNonNull, GraphQLString } from "graphql"
import { OrderType } from "schema/order/index"
export const Order = {
  name: "Orders",
  type: OrderType,
  description: "Returns a single Order",
  args: { id: { type: new GraphQLNonNull(GraphQLString) } },
  resolve: (_parent, _args, context, { rootValue: { stressSchema } }) => {
    const query = `
      query EcommerceOrder($id: ID!) {
        ecommerce_order(id: $id) {
          id
          code
          currencyCode
          state
          partnerId
        }
      }
    `
    return graphql(stressSchema, query, null, context, {
      id: _args.id,
    }).then(a => a.data.ecommerce_order)
  },
}
