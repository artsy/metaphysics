import { GraphQLString } from "graphql"
import { mutationWithClientMutationId } from "graphql-relay"
import { ShowType } from "../show"

export default mutationWithClientMutationId({
  name: "FollowFair",
  description: "Follow (or unfollow) a fair",
  inputFields: {
    partner_show_id: { type: GraphQLString },
  },
  outputFields: {
    show: {
      type: ShowType,
      resolve: (
        { partner_show },
        _options,
        _request,
        { rootValue: { showLoader } }
      ) => showLoader(partner_show.id),
    },
  },
  mutateAndGetPayload: (
    options,
    _request,
    { rootValue: { followShowLoader } }
  ) => {
    if (!followShowLoader) {
      throw new Error("Missing Follow Show Loader. Check your access token.")
    }
    return followShowLoader(options)
  },
})
