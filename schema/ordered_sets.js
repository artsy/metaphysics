import gravity from "lib/loaders/gravity"
import OrderedSet from "./ordered_set"
import { GraphQLString, GraphQLNonNull, GraphQLList, GraphQLBoolean } from "graphql"

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
  },
  resolve: (root, options) => gravity("sets", options),
}

export default OrderedSets
