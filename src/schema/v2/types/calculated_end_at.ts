import { GraphQLObjectType, GraphQLInt } from "graphql"

export const CalculatedEndAtType = new GraphQLObjectType({
  name: "CalculatedEndAt",
  fields: {
    days: {
      type: GraphQLInt,
    },
  },
})
