import Artist from "../artist"
import { GraphQLObjectType, GraphQLList, GraphQLInt, GraphQLBoolean } from "graphql"

const PopularArtistsType = new GraphQLObjectType({
  name: "PopularArtists",
  fields: () => ({
    artists: {
      type: new GraphQLList(Artist.type),
      resolve: results => results,
    },
  }),
})

const PopularArtists = {
  type: PopularArtistsType,
  description: "Popular artists",
  args: {
    exclude_followed_artists: {
      type: GraphQLBoolean,
      description: "If true, will exclude followed artists for the user",
    },
    size: {
      type: GraphQLInt,
      description: "Number of results to return",
    },
  },
  resolve: ({ userID, popularArtistsLoader, authenticatedPopularArtistsLoader }, options) => {
    const loader = userID ? authenticatedPopularArtistsLoader : popularArtistsLoader
    return loader(options)
  },
}

export default PopularArtists
