import { GraphQLSchema } from "graphql"

export const diffusionStitchingEnvironment = (
  _localSchema: GraphQLSchema,
  _diffusionSchema: GraphQLSchema & { transforms: any }
) => ({
  // The SDL used to declare how to stitch an object
  extensionSchema: "",

  // Resolvers for the above
  resolvers: {},
})
