import gravity from "lib/loaders/legacy/gravity"
import { map } from "lodash"
import { total as getTotal } from "lib/loaders/legacy/total"
import Artist from "schema/artist"
import { GraphQLInt, GraphQLList, GraphQLObjectType } from "graphql"

const FollowArtistsType = new GraphQLObjectType({
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
      type: new GraphQLObjectType({
        name: "FollowArtistCounts",
        fields: {
          artists: {
            type: GraphQLInt,
            resolve: (data, options, request, { rootValue: { accessToken } }) => {
              return getTotal("me/follow/artists", accessToken, {
                total_count: true,
              }).then(({ body: { total } }) => total)
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
  resolve: (root, options, request, { rootValue: { accessToken } }) => {
    if (!accessToken) return null
    return gravity.with(accessToken)("me/follow/artists", options)
  },
}
