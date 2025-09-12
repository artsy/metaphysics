import { GraphQLSchema } from "graphql"
import { GraphQLSchemaWithTransforms } from "graphql-tools"

export const gravityStitchingEnvironment = (
  _localSchema: GraphQLSchema,
  _gravitySchema: GraphQLSchemaWithTransforms
) => {
  return {
    extensionSchema: null,
    resolvers: [],
  }
}
