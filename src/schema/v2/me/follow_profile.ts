import { GraphQLString, GraphQLBoolean, GraphQLNonNull } from "graphql"
import { mutationWithClientMutationId } from "graphql-relay"
import { meType } from "schema/v2/me"
import { ProfileType } from "schema/v2/profile"
import { ResolverContext } from "types/graphql"

export default mutationWithClientMutationId<any, any, ResolverContext>({
  name: "FollowProfile",
  description: "Follow (or unfollow) a profile",
  inputFields: {
    profileID: {
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
    me: {
      type: new GraphQLNonNull(meType),
      resolve: (_root, _options, { meLoader }) => meLoader?.(),
    },
  },
  mutateAndGetPayload: (
    { profileID: profile_id, unfollow },
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
