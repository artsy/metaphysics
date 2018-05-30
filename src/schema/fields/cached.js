import { GraphQLInt } from "graphql"

export default {
  type: GraphQLInt,
  resolve: ({ cached }) => {return new Date().getTime() - cached},
}
