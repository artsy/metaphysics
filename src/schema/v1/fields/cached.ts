import { GraphQLInt } from "graphql"

export default {
  type: GraphQLInt,
  resolve: ({ cached }) => new Date().getTime() - cached,
}
