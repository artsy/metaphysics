// @ts-check
import { GraphQLString, GraphQLObjectType, GraphQLNonNull } from "graphql"
import config from "config"

const ConvectionSchema = new GraphQLObjectType({
  name: "Convection",
  fields: () => ({
    geminiTemplateKey: {
      type: new GraphQLNonNull(GraphQLString),
    },
  }),
})

const Convection = {
  type: ConvectionSchema,
  description: "The schema for convection's ENV settings",
  args: {},
  resolve: () => ({
    geminiTemplateKey: config.CONVECTION_GEMINI_TEMPLATE,
  }),
}

export default Convection
