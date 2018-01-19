import gravity from "lib/loaders/legacy/gravity"
import { GraphQLString, GraphQLBoolean } from "graphql"
import { mutationWithClientMutationId } from "graphql-relay"
import { ArtistType } from "schema/artist/index"
import PopularArtists from "schema/artists/popular"

export default mutationWithClientMutationId({
  name: "FollowArtist",
  decription: "Follow (or unfollow) an artist",
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
    { rootValue: { accessToken } }
  ) => {
    if (!accessToken) {
      return new Error("You need to be signed in to perform this action")
    }

    const saveMethod = unfollow ? "DELETE" : "POST"
    const options = unfollow ? {} : { artist_id }
    const followPath = unfollow ? `/${artist_id}` : ""
    return gravity
      .with(accessToken, {
        method: saveMethod,
      })(`/me/follow/artist${followPath}`, options)
      .then(() => ({ artist_id }))
  },
})
