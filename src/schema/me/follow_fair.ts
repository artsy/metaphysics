import { GraphQLString } from "graphql"
import { mutationWithClientMutationId } from "graphql-relay"
import Profile from "schema/profile"

export default mutationWithClientMutationId({
  name: "FollowFair",
  description: "Follow (or unfollow) a fair",
  inputFields: {
    profile_id: { type: GraphQLString },
  },
  outputFields: {
    profile: {
      type: Profile.type,
      resolve: (
        { profile },
        _options,
        _request,
        { rootValue: { profileLoader } }
      ) => profileLoader(profile.id),
    },
  },
  mutateAndGetPayload: (
    options,
    _request,
    { rootValue: { followProfileLoader } }
  ) => {
    if (!followProfileLoader) {
      throw new Error("Missing FollowProfile Loader. Check your access token.")
    }
    return followProfileLoader(options)
  },
})
