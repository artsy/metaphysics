import { GraphQLString, GraphQLBoolean } from "graphql"
import { mutationWithClientMutationId } from "graphql-relay"
import { ArtistType } from "schema/artist/index"
import PopularArtists from "schema/artists/popular"

export default mutationWithClientMutationId({
  name: "FollowArtist",
  description: "Follow (or unfollow) an artist",
  inputFields: {
    artist_id: {
      type: GraphQLString,
    },
    unfollow: {
      type: GraphQLBoolean,
      defaultValue: false,
    },
  },
  outputFields: {
    artist: {
      type: ArtistType,
      resolve: (
        { artist_id },
        options,
        request,
        { rootValue: { artistLoader } }
      ) => artistLoader(artist_id),
    },
    popular_artists: PopularArtists,
  },
  mutateAndGetPayload: (
    { artist_id, unfollow },
    request,
    { rootValue: { accessToken, followArtistLoader, unfollowArtistLoader } }
  ) => {
    if (!accessToken) {
      return new Error("You need to be signed in to perform this action")
    }

    let performAction = null
    if (unfollow) {
      performAction = unfollowArtistLoader(artist_id)
    } else {
      performAction = followArtistLoader({ artist_id })
    }

    return performAction.then(() => ({ artist_id }))
  },
})
