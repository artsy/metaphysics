import { map } from "lodash"
import { totalViaLoader } from "lib/total"
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
            resolve: (
              data,
              options,
              request,
              { rootValue: { followedArtistsLoader } }
            ) => {
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
    root,
    options,
    request,
    { rootValue: { followedArtistsLoader } }
  ) => {
    if (!followedArtistsLoader) return null
    return followedArtistsLoader(options).then(({ body }) => body)
  },
}
