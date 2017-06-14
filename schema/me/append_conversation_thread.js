import impulse from "lib/loaders/impulse"
import gravity from "lib/loaders/gravity"
import { ConversationType } from "./conversation"
import { GraphQLString, GraphQLNonNull } from "graphql"
const { IMPULSE_APPLICATION_ID } = process.env
import { mutationWithClientMutationId } from "graphql-relay"

export default mutationWithClientMutationId({
  name: "AppendConversationThread",
  description: "Appending a message to a conversation thread",
  inputFields: {
    id: {
      type: new GraphQLNonNull(GraphQLString),
      description: "The id of the conversation to be updated",
    },
    message_body: {
      type: new GraphQLNonNull(GraphQLString),
    },
  },
  outputFields: {
    conversation: {
      type: new GraphQLNonNull(ConversationType),
    },
  },
  mutateAndGetPayload: ({ message_body, id }, request, { rootValue: { accessToken } }) => {
    if (!accessToken) return null
    return gravity
      .with(accessToken, { method: "POST" })("me/token", {
        client_application_id: IMPULSE_APPLICATION_ID,
      })
      .then(data => {
        return Promise.resolve(
          impulse.with(data.token, { method: "PUT" })(`conversations/${id}/messages`, {
            to: "partner@gallery.de",
            from: "sarah.scott+messaging@artsymail.com",
            body_text: message_body,
          })
        ).then(conversation => conversation)
      })
  },
})
