import { GraphQLObjectType, GraphQLID, GraphQLString } from "graphql"

const HomePageModuleParams = new GraphQLObjectType({
  name: "HomePageModulesParams",
  fields: {
    followed_artist_id: {
      type: GraphQLID,
    },
    gene_id: {
      type: GraphQLString,
    },
    id: {
      type: GraphQLID,
    },
    medium: {
      type: GraphQLString,
    },
    price_range: {
      type: GraphQLString,
    },
    related_artist_id: {
      type: GraphQLID,
    },
  },
})

export default {
  type: HomePageModuleParams,
  resolve: ({ params }) => params,
}
