import { GraphQLString, GraphQLBoolean } from "graphql"
import { mutationWithClientMutationId } from "graphql-relay"
import { ProfileType } from "schema/v1/profile"
import { ResolverContext } from "types/graphql"

export default mutationWithClientMutationId<any, any, ResolverContext>({
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
      resolve: ({ profile_id }, _options, { profileLoader }) =>
        profileLoader(profile_id),
    },
  },
  mutateAndGetPayload: (
    { profile_id, unfollow },
    { followProfileLoader, unfollowProfileLoader }
  ) => {
    if (!followProfileLoader || !unfollowProfileLoader) {
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
