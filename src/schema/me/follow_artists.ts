import { map } from "lodash"
import { totalViaLoader } from "lib/total"
import Artist from "schema/artist"
import { GraphQLInt, GraphQLList, GraphQLObjectType } from "graphql"

const FollowArtistsType = new GraphQLObjectType<ResolverContext>({
  name: "FollowArtists",
  fields: {
    artists: {
      type: new GraphQLList(Artist.type),
      resolve: data => {
        const artists = data.artists ? data.artists : data
        return map(artists, "artist")
      },
    },
    counts: {
      type: new GraphQLObjectType<ResolverContext>({
        name: "FollowArtistCounts",
        fields: {
          artists: {
            type: GraphQLInt,
            resolve: (
              _data,
              _options,
              _request,
              { rootValue: { followedArtistsLoader } }
            ) => {
              // FIXME: Expected 2-3 arguments, but got 1.
              // @ts-ignore
              return totalViaLoader(followedArtistsLoader)
            },
          },
        },
      }),
      resolve: follows => follows,
    },
  },
})

export default {
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
  resolve: (
    _root,
    options,
    _request,
    { rootValue: { followedArtistsLoader } }
  ) => {
    if (!followedArtistsLoader) return null
    return followedArtistsLoader(options).then(({ body }) => body)
  },
}
