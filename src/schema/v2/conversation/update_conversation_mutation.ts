import { GraphQLString, GraphQLNonNull } from "graphql"
import { mutationWithClientMutationId } from "graphql-relay"
import Conversation from "schema/v2/conversation"
import { ResolverContext } from "types/graphql"

export default mutationWithClientMutationId<any, any, ResolverContext>({
  name: "UpdateConversationMutation",
  description: "Update a conversation.",
  inputFields: {
    conversationId: {
      type: new GraphQLNonNull(GraphQLString),
      description: "The id of the conversation to be updated.",
    },
    fromLastViewedMessageId: {
      type: new GraphQLNonNull(GraphQLString),
      description: "The message id to mark as read.",
    },
  },
  outputFields: {
    conversation: {
      type: Conversation.type,
      resolve: (conversation) => conversation,
    },
  },
  mutateAndGetPayload: (
    { conversationId, fromLastViewedMessageId },
    { conversationUpdateLoader }
  ) => {
    if (!conversationUpdateLoader) return null
    return conversationUpdateLoader(conversationId, {
      from_last_viewed_message_id: fromLastViewedMessageId,
    })
  },
})
