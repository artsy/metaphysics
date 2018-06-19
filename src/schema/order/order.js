import { graphql, GraphQLNonNull, GraphQLString } from "graphql"
import { OrderType } from "schema/order/index"
export const Order = {
  name: "Order",
  type: OrderType,
  description: "Returns a single Order",
  args: { id: { type: new GraphQLNonNull(GraphQLString) } },
  resolve: (_parent, _args, context, { rootValue: { stressSchema } }) => {
    const query = `
      query EcommerceOrder($id: ID!) {
        order(id: $id) {
          id
        }
      }
    `
    return graphql(stressSchema, query, null, context, {
      id: _args.id,
    }).then(a => a.data.order)
  },
}
