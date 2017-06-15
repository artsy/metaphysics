import gravity from "lib/loaders/gravity"
import { GraphQLString, GraphQLBoolean } from "graphql"
import { mutationWithClientMutationId } from "graphql-relay"
import { ProfileType } from "schema/profile"

export default mutationWithClientMutationId({
  name: "FollowProfile",
  decription: "Follow (or unfollow) a profile",
  inputFields: {
    profile_id: {
      type: GraphQLString,
    },
    unfollow: {
      type: GraphQLBoolean,
      defaultValue: false,
    },
  },
  outputFields: {
    artist: {
      type: ProfileType,
      resolve: ({ profile_id }) => {
        return gravity(`profile/${profile_id}`).then(profile => {
          return profile
        })
      },
    },
  },
  mutateAndGetPayload: ({ profile_id, unfollow }, request, { rootValue: { accessToken } }) => {
    if (!accessToken) return new Error("You need to be signed in to perform this action")
    const saveMethod = unfollow ? "DELETE" : "POST"
    const options = unfollow ? {} : { profile_id }
    const followPath = unfollow ? `/${profile_id}` : ""
    return gravity
      .with(accessToken, {
        method: saveMethod,
      })(`/me/follow/profile${followPath}`, options)
      .then(() => ({ profile_id }))
  },
})
