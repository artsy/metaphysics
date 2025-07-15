import { GraphQLString, GraphQLObjectType, GraphQLNonNull } from "graphql"
import { ResolverContext } from "types/graphql"

const ConvectionSchema = new GraphQLObjectType<any, ResolverContext>({
  name: "ConvectionService",
  fields: () => ({
    geminiTemplateKey: {
      type: new GraphQLNonNull(GraphQLString),
    },
  }),
})

// TODO: This isn't being used as a GraphQLFieldConfig, it seems.
const Convection = {
  type: ConvectionSchema,
  description: "The schema for convection's ENV settings",
  args: {},
  resolve: () => ({
    geminiTemplateKey: "",
  }),
}

export default Convection
