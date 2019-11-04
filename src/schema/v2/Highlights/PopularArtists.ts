import { ArtistType } from "../artist"
import {
  GraphQLList,
  GraphQLInt,
  GraphQLBoolean,
  GraphQLString,
  GraphQLFieldConfig,
} from "graphql"
import { ResolverContext } from "types/graphql"

export const PopularArtistsField: GraphQLFieldConfig<void, ResolverContext> = {
  type: new GraphQLList(ArtistType),
  description: "Popular artists",
  args: {
    excludeFollowedArtists: {
      type: GraphQLBoolean,
      description: "If true, will exclude followed artists for the user",
    },
    excludeArtistIDs: {
      type: new GraphQLList(GraphQLString),
      description:
        "Exclude these ids from results, may result in all artists being excluded.",
    },
    size: {
      type: GraphQLInt,
      description: "Number of results to return",
    },
  },
  resolve: (
    _root,
    { excludeFollowedArtists, excludeArtistIDs, ..._options },
    { popularArtistsLoader }
  ) => {
    const options: any = {
      exclude_followed_artists: excludeFollowedArtists,
      exclude_artist_ids: excludeArtistIDs,
      ..._options,
    }
    return popularArtistsLoader(options)
  },
}
