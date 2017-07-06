import impulse from "lib/loaders/impulse"
import gravity from "lib/loaders/gravity"
import { GraphQLString, GraphQLNonNull } from "graphql"
import { mutationWithClientMutationId, cursorForObjectInConnection } from "graphql-relay"
import { ConversationType, MessageEdge } from "./index"

const { IMPULSE_APPLICATION_ID } = process.env

const getImpulseToken = gravityToken => {
  return gravity.with(gravityToken, { method: "POST" })("me/token", {
    client_application_id: IMPULSE_APPLICATION_ID,
  })
}

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
          cursor: cursorForObjectInConnection([newMessagePayload], newMessagePayload),
          node: newMessagePayload,
        }
      },
    },
  },
  mutateAndGetPayload: ({ id, from, to, body_text, reply_to_message_id }, request, { rootValue: { accessToken } }) => {
    if (!accessToken) return null
    let impulseToken
    return getImpulseToken(accessToken)
      .then(data => {
        impulseToken = data.token
        return impulse.with(impulseToken, { method: "POST" })(`conversations/${id}/messages`, {
          reply_all: true,
          reply_to_message_id,
          from,
          body_text,
        })
      })
      .then(({ id: newMessageID }) => {
        return impulse.with(impulseToken, { method: "GET" })(`conversations/${id}`).then(updatedConversation => {
          return {
            conversation: updatedConversation,
            // Because Impulse does not have the full new message object available immediately, we return an optimistic
            // response so the mutation can return it too.
            newMessagePayload: {
              id: newMessageID,
              from_email_address: from,
              raw_text: body_text,
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
