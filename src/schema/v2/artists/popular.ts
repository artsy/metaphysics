import Artist from "../artist"
import {
  GraphQLObjectType,
  GraphQLList,
  GraphQLInt,
  GraphQLBoolean,
  GraphQLString,
  GraphQLFieldConfig,
} from "graphql"
import { ResolverContext } from "types/graphql"

const PopularArtistsType = new GraphQLObjectType<any, ResolverContext>({
  name: "PopularArtists",
  fields: () => ({
    artists: {
      type: new GraphQLList(Artist.type),
      resolve: results => results,
    },
  }),
})

const PopularArtists: GraphQLFieldConfig<void, ResolverContext> = {
  type: PopularArtistsType,
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

export default PopularArtists
