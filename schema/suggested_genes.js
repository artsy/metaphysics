import fetch from "../lib/apis/fetch"
import { GraphQLObjectType, GraphQLList, GraphQLString } from "graphql"

const SuggestedGeneType = new GraphQLObjectType({
  name: "SuggestedGenes",
  fields: {
    id: { type: GraphQLString },
    image_url: { type: GraphQLString },
    _id: { type: GraphQLString },
    name: { type: GraphQLString },
  },
})

const SUGGESTED_GENES_JSON = "https://s3.amazonaws.com/eigen-production/json/eigen_categories.json"
const SuggestedGenes = {
  type: new GraphQLList(SuggestedGeneType),
  description: "List of curated genes wit custom images",
  resolve: () => fetch(SUGGESTED_GENES_JSON).then(({ body }) => body),
}

export default SuggestedGenes
