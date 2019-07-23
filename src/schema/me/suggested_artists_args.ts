import { GraphQLBoolean, GraphQLString, GraphQLInt, GraphQLList } from "graphql"

export const SuggestedArtistsArgs = {
  artist_id: {
    type: GraphQLString,
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
  exclude_artist_ids: {
    type: new GraphQLList(GraphQLString),
    description:
      "Exclude these ids from results, may result in all artists being excluded.",
  },
  page: {
    type: GraphQLInt,
    description: "Pagination, need I say more?",
  },
  size: {
    type: GraphQLInt,
    description: "Amount of artists to return",
  },
}
