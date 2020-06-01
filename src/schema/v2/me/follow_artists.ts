import { map } from "lodash"
import { totalViaLoader } from "lib/total"
import Artist from "schema/v2/artist"
import {
  GraphQLInt,
  GraphQLList,
  GraphQLObjectType,
  GraphQLFieldConfig,
} from "graphql"
import { ResolverContext } from "types/graphql"

export const FollowArtistsType = new GraphQLObjectType<any, ResolverContext>({
  name: "FollowArtists",
  fields: {
    artists: {
      type: new GraphQLList(Artist.type),
      resolve: (data) => {
        const artists = data.artists ? data.artists : data
        return map(artists, "artist")
      },
    },
    counts: {
      type: new GraphQLObjectType<any, ResolverContext>({
        name: "FollowArtistCounts",
        fields: {
          artists: {
            type: GraphQLInt,
            resolve: (_data, _options, { followedArtistsLoader }) => {
              // FIXME: Expected 2-3 arguments, but got 1.
              // @ts-ignore
              return totalViaLoader(followedArtistsLoader)
            },
          },
        },
      }),
      resolve: (follows) => follows,
    },
  },
})

const FollowArtists: GraphQLFieldConfig<void, ResolverContext> = {
  type: FollowArtistsType,
  description: "A list of the current user’s artist follows",
  args: {
    page: {
      type: GraphQLInt,
    },
    size: {
      type: GraphQLInt,
    },
  },
  resolve: (_root, options, { followedArtistsLoader }) => {
    if (!followedArtistsLoader) return null
    return followedArtistsLoader(options).then(({ body }) => body)
  },
}

export default FollowArtists
