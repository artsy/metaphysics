import Artist from "schema/artist"
import { GraphQLBoolean, GraphQLList, GraphQLNonNull, GraphQLString, GraphQLInt } from "graphql"

export default {
  type: new GraphQLList(Artist.type),
  description: "A list of the current user’s suggested artists, based on a single artist",
  args: {
    artist_id: {
      type: new GraphQLNonNull(GraphQLString),
      description: "The slug or ID of an artist",
    },
    exclude_artists_without_forsale_artworks: {
      type: GraphQLBoolean,
      description: "Exclude artists without for sale works",
    },
    exclude_artists_without_artworks: {
      type: GraphQLBoolean,
      description: "Exclude artists without any artworks",
    },
    exclude_followed_artists: {
      type: GraphQLBoolean,
      description: "Exclude artists the user already follows",
    },
    page: {
      type: GraphQLInt,
      description: "Pagination, need I say more?",
    },
    size: {
      type: GraphQLInt,
      description: "Amount of artists to return",
    },
  },
  resolve: (root, options, request, { rootValue: { suggestedArtistsLoader } }) => {
    if (!suggestedArtistsLoader) return null
    return suggestedArtistsLoader(options)
  },
}
