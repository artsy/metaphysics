import { OrderedSet } from "./OrderedSet"
import {
  GraphQLString,
  GraphQLNonNull,
  GraphQLList,
  GraphQLBoolean,
  GraphQLFieldConfig,
} from "graphql"
import { ResolverContext } from "types/graphql"

const OrderedSets: GraphQLFieldConfig<void, ResolverContext> = {
  type: new GraphQLList(OrderedSet.type),
  description: "A collection of OrderedSets",
  args: {
    key: {
      type: new GraphQLNonNull(GraphQLString),
      description: "Key to the OrderedSet or group of OrderedSets",
    },
    public: {
      type: GraphQLBoolean,
      defaultValue: true,
    },
  },
  resolve: async (_root, args, { setsLoader }) => {
    const { body } = await setsLoader(args)
    return body
  },
}

export default OrderedSets
