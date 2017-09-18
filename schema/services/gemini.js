// @ts-check
import { GraphQLString, GraphQLObjectType } from "graphql"

const GeminiSchema = new GraphQLObjectType({
  name: "Gemini",
  fields: () => ({
    api_base: {
      type: GraphQLString,
    },
    cloudfront_url: {
      type: GraphQLString,
    },
  }),
})

const Gemini = {
  type: GeminiSchema,
  description: "The schema for microservice settings",
  args: {},
  resolve: () => ({
    api_base: process.env.GEMINI_APP,
    cloudfront_url: process.env.GEMINI_CLOUDFRONT_URL,
  }),
}

export default Gemini
