import OrderedSet from "./ordered_set"
import {
  GraphQLString,
  GraphQLNonNull,
  GraphQLList,
  GraphQLBoolean,
  GraphQLInt,
} from "graphql"

const OrderedSets = {
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
  resolve: (root, options, request, { rootValue: { setsLoader } }) =>
    setsLoader(options),
}

export default OrderedSets
