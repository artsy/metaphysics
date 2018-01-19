import { GraphQLString, GraphQLNonNull } from "graphql"
import {
  mutationWithClientMutationId,
  cursorForObjectInConnection,
} from "graphql-relay"
import { ConversationType, MessageEdge } from "./index"

export default mutationWithClientMutationId({
  name: "SendConversationMessageMutation",
  description: "Appending a message to a conversation thread",
  inputFields: {
    id: {
      type: new GraphQLNonNull(GraphQLString),
      description: "The id of the conversation to be updated",
    },
    from: {
      type: new GraphQLNonNull(GraphQLString),
      description: "The email address of the message sender",
    },
    body_text: {
      type: new GraphQLNonNull(GraphQLString),
    },
    reply_to_message_id: {
      type: new GraphQLNonNull(GraphQLString),
      description: "The message being replied to",
    },
  },
  outputFields: {
    conversation: {
      type: ConversationType,
      resolve: ({ conversation }) => conversation,
    },
    messageEdge: {
      type: MessageEdge,
      resolve: ({ newMessagePayload }) => {
        return {
          cursor: cursorForObjectInConnection(
            [newMessagePayload],
            newMessagePayload
          ),
          node: newMessagePayload,
        }
      },
    },
  },
  mutateAndGetPayload: (
    { id, from, from_id, to, body_text, reply_to_message_id },
    request,
    {
      rootValue: {
        conversationLoader,
        conversationCreateMessageLoader,
        userID,
      },
    }
  ) => {
    if (!conversationCreateMessageLoader) return null
    return conversationCreateMessageLoader(id, {
      from,
      reply_to_message_id,
      body_text,
    }).then(({ id: newMessageID }) => {
      return conversationLoader(id).then(updatedConversation => {
        return {
          conversation: updatedConversation,
          // Because Impulse does not have the full new message object available immediately, we return an optimistic
          // response so the mutation can return it too.
          newMessagePayload: {
            id: newMessageID,
            from_email_address: from,
            from_id: userID,
            raw_text: body_text,
            body: body_text,
            created_at: new Date().toISOString(),
            attachments: [],
            // This addition is only for MP so it can determine if the message was from the current user.
            conversation_from_address: updatedConversation.from_email,
          },
        }
      })
    })
  },
})
