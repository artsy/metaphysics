import { GraphQLString, GraphQLBoolean } from "graphql"
import { mutationWithClientMutationId } from "graphql-relay"
import { ShowType } from "../show"
import { ResolverContext } from "types/graphql"

export default mutationWithClientMutationId<any, any, ResolverContext>({
  name: "FollowShow",
  description: "Follow (or unfollow) a show",
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
      resolve: ({ partner_show }, _options, { showLoader }) =>
        showLoader(partner_show.id),
    },
  },
  mutateAndGetPayload: (
    { partner_show_id, unfollow },
    { followShowLoader, unfollowShowLoader }
  ) => {
    if (!followShowLoader || !unfollowShowLoader) {
      throw new Error("Missing Follow Show Loader. Check your access token.")
    }

    const performAction = unfollow
      ? unfollowShowLoader({ partner_show_id })
      : followShowLoader({ partner_show_id })

    return performAction.then((returnValue) => returnValue)
  },
})
