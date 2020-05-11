import { GraphQLInt } from "graphql"

export default {
  type: GraphQLInt,
  resolve: ({ cached }: { cached: number }) => new Date().getTime() - cached,
}
