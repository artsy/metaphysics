import { GraphQLSchema } from "graphql"
import { GraphQLSchemaWithTransforms } from "graphql-tools"

export const diffusionStitchingEnvironment = (
  _localSchema: GraphQLSchema,
  _diffusionSchema: GraphQLSchemaWithTransforms
) => ({
  // The SDL used to declare how to stitch an object
  extensionSchema: "",

  // Resolvers for the above
  resolvers: {},
})
