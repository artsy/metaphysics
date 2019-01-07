import { GraphQLString, GraphQLBoolean } from "graphql"
import { mutationWithClientMutationId } from "graphql-relay"
import { ShowType } from "../show"

export default mutationWithClientMutationId({
  name: "FollowShow",
  description: "Follow (or unfollow) an show",
  inputFields: {
    partner_show_id: {
      type: GraphQLString,
    },
    unfollow: {
      type: GraphQLBoolean,
      defaultValue: false,
    },
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
    { partner_show_id, unfollow },
    _request,
    { rootValue: { followShowLoader, unfollowShowLoader } }
  ) => {
    if (!followShowLoader) {
      throw new Error("Missing Follow Show Loader. Check your access token.")
    }

    let performAction = unfollow
      ? unfollowShowLoader({ partner_show_id })
      : followShowLoader({ partner_show_id })

    return performAction.then(returnValue => returnValue)
  },
})
