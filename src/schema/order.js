import { GraphQLNonNull, GraphQLString } from "graphql"
import { OrderType } from "schema/me/order"

export const Order = {
  name: "Order",
  type: OrderType,
  description: "Returns a single Order",
  args: { id: { type: new GraphQLNonNull(GraphQLString) } },
  resolve: (root, { id }, request, { rootValue: { orderLoader } }) =>
    orderLoader({
      id,
    }).then(response => response.body),
}
