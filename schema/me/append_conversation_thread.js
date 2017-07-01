import impulse from "lib/loaders/impulse"
import gravity from "lib/loaders/gravity"
import { GraphQLString, GraphQLNonNull, GraphQLObjectType } from "graphql"
const { IMPULSE_APPLICATION_ID } = process.env
import { mutationWithClientMutationId, cursorForObjectInConnection } from "graphql-relay"
import { ConversationType, MessageEdge } from "./conversation"

const getImpulseToken = gravityToken => {
  return gravity.with(gravityToken, { method: "POST" })("me/token", {
    client_application_id: IMPULSE_APPLICATION_ID,
  })
}

const AppendConversationThreadMutationPayload = new GraphQLObjectType({
  name: "AppendConversationThreadMutationPayload",
  fields: {
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
})

export default mutationWithClientMutationId({
  name: "AppendConversationThread",
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
    payload: {
      type: AppendConversationThreadMutationPayload,
      resolve: data => data,
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
      .then(newMessagePayload => {
        return impulse.with(impulseToken, { method: "GET" })(`conversations/${id}`).then(impulseData => {
          return { conversation: impulseData, newMessagePayload }
        })
      })
  },
})
