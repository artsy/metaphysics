// @ts-check
import { GraphQLString, GraphQLObjectType } from "graphql"

const ConvectionSchema = new GraphQLObjectType({
  name: "Convection",
  fields: () => ({
    api_base: {
      type: GraphQLString,
    },
    app_id: {
      type: GraphQLString,
    },
    gemini_app_id: {
      type: GraphQLString,
    },
  }),
})

const Convection = {
  type: ConvectionSchema,
  description: "The schema for microservice settings",
  args: {},
  resolve: () => ({
    api_base: process.env.CONVECTION_API_BASE,
    app_id: process.env.CONVECTION_APP_ID,
    gemini_app_id: process.env.CONVECTION_GEMINI_APP,
  }),
}

export default Convection
