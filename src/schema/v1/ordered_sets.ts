import OrderedSet from "./ordered_set"
import {
  GraphQLString,
  GraphQLNonNull,
  GraphQLList,
  GraphQLBoolean,
  GraphQLInt,
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
    page: {
      type: GraphQLInt,
      defaultValue: 1,
    },
    size: {
      type: GraphQLInt,
      defaultValue: 10,
    },
  },
  resolve: (_root, options, { setsLoader }) => setsLoader(options),
}

export default OrderedSets
