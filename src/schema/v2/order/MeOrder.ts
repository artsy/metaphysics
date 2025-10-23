import { GraphQLFieldConfig, GraphQLNonNull, GraphQLID } from "graphql"
import { ResolverContext } from "types/graphql"
import { OrderType } from "./types/OrderType"

export const MeOrder: GraphQLFieldConfig<void, ResolverContext> = {
  args: {
    id: {
      type: new GraphQLNonNull(GraphQLID),
    },
  },
  type: OrderType,
  resolve: async (_root, { id }, { meOrderLoader }) => {
    if (!meOrderLoader) return null
    const order = await meOrderLoader(id)

    return order
  },
}
