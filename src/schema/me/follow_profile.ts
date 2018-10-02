import { GraphQLString, GraphQLBoolean } from "graphql"
import { mutationWithClientMutationId } from "graphql-relay"
import { ProfileType } from "schema/profile"

export default mutationWithClientMutationId({
  name: "FollowProfile",
  description: "Follow (or unfollow) a profile",
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
    profile: {
      type: ProfileType,
      resolve: (
        { profile_id },
        _options,
        _request,
        { rootValue: { profileLoader } }
      ) => profileLoader(profile_id),
    },
  },
  mutateAndGetPayload: (
    { profile_id, unfollow },
    _request,
    { rootValue: { accessToken, followProfileLoader, unfollowProfileLoader } }
  ) => {
    if (!accessToken) {
      return new Error("You need to be signed in to perform this action")
    }

    let performAction
    if (unfollow) {
      performAction = unfollowProfileLoader(profile_id)
    } else {
      performAction = followProfileLoader({ profile_id })
    }

    return performAction.then(() => ({ profile_id }))
  },
})
