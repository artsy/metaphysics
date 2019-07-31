import {
  GraphQLBoolean,
  GraphQLString,
  GraphQLInt,
  GraphQLList,
  GraphQLFieldConfigArgumentMap,
} from "graphql"

export const SuggestedArtistsArgs: GraphQLFieldConfigArgumentMap = {
  artistID: {
    type: GraphQLString,
    description: "The slug or ID of an artist",
  },
  excludeArtistsWithoutForsaleArtworks: {
    type: GraphQLBoolean,
    description: "Exclude artists without for sale works",
  },
  excludeArtistsWithoutArtworks: {
    type: GraphQLBoolean,
    description: "Exclude artists without any artworks",
  },
  excludeFollowedArtists: {
    type: GraphQLBoolean,
    description: "Exclude artists the user already follows",
  },
  excludeArtistIDs: {
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
