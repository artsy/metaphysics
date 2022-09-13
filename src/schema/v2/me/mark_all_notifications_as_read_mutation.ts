import { GraphQLBoolean } from "graphql"
import { mutationWithClientMutationId } from "graphql-relay"
import { ResolverContext } from "types/graphql"

export const markAllNotificationsAsReadMutation = mutationWithClientMutationId<
  any,
  any,
  ResolverContext
>({
  name: "MarkAllNotificationsAsRead",
  description: "Mark all unread notifications as read",
  inputFields: {},
  outputFields: {
    success: {
      type: GraphQLBoolean,
      resolve: (result) => result.success,
    },
  },
  mutateAndGetPayload: async (_, { updateNotificationsLoader }) => {
    if (!updateNotificationsLoader) {
      throw new Error("You need to be signed in to perform this action")
    }

    try {
      await updateNotificationsLoader({ status: "read" })

      return {
        success: true,
      }
    } catch {
      return {
        success: false,
      }
    }
  },
})
