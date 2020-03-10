import { GraphQLObjectType, GraphQLInt } from "graphql"
import { ResolverContext } from "types/graphql"

export const YearRange = new GraphQLObjectType<any, ResolverContext>({
  name: "YearRange",
  fields: {
    startAt: {
      type: GraphQLInt,
      description: "The first year of the year range",
    },
    endAt: {
      type: GraphQLInt,
      description: "The last year of the year range",
    },
  },
})
