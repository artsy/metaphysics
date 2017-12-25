// @ts-check
import { GraphQLString, GraphQLObjectType, GraphQLNonNull } from "graphql"

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
    geminiTemplateKey: process.env.CONVECTION_GEMINI_TEMPLATE,
  }),
}

export default Convection
