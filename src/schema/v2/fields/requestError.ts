import { GraphQLObjectType, GraphQLNonNull, GraphQLInt } from "graphql"
import { ResolverContext } from "types/graphql"

export const RequestErrorType = new GraphQLObjectType<any, ResolverContext>({
  name: "RequestError",
  fields: {
    statusCode: {
      type: new GraphQLNonNull(GraphQLInt),
    },
  },
})
