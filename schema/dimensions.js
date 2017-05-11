import { GraphQLObjectType, GraphQLString } from "graphql"

const Dimensions = new GraphQLObjectType({
  name: "dimensions",
  fields: {
    in: {
      type: GraphQLString,
    },
    cm: {
      type: GraphQLString,
    },
  },
})

export default {
  type: Dimensions,
}
