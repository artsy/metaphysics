import { GraphQLFieldConfig, GraphQLNonNull, GraphQLString } from "graphql"
import { ResolverContext } from "types/graphql"
import { OrderType } from "schema/v2/order/sharedOrderTypes"

export const MeOrder: GraphQLFieldConfig<void, ResolverContext> = {
  args: {
    id: {
      type: new GraphQLNonNull(GraphQLString),
    },
  },
  type: OrderType,
  resolve: async (_root, { id }, { meOrderLoader }) => {
    if (!meOrderLoader) return null
    const order = await meOrderLoader(id)

    return order
  },
}
