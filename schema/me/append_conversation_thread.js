import impulse from "lib/loaders/impulse"
import gravity from "lib/loaders/gravity"
import { GraphQLString, GraphQLNonNull, GraphQLObjectType } from "graphql"
const { IMPULSE_APPLICATION_ID } = process.env
import { mutationWithClientMutationId } from "graphql-relay"

const MessagePayloadType = new GraphQLObjectType({
  name: "MessagePayloadType",
  description: "Expected payload from a successful message post",
  fields: {
    id: {
      description: "Impulse id.",
      type: new GraphQLNonNull(GraphQLString),
    },
    radiation_message_id: {
      type: new GraphQLNonNull(GraphQLString),
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
  },
  outputFields: {
    message: {
      type: MessagePayloadType,
      resolve: message => message,
    },
  },
  mutateAndGetPayload: ({ id, from, to, body_text }, request, { rootValue: { accessToken } }) => {
    if (!accessToken) return null
    return gravity
      .with(accessToken, { method: "POST" })("me/token", {
        client_application_id: IMPULSE_APPLICATION_ID,
      })
      .then(data => {
        return Promise.resolve(
          impulse.with(data.token, { method: "POST" })(`conversations/${id}/messages`, {
            to: ["partner@example.com"],
            from,
            body_text,
          })
        ).then(message => message)
      })
  },
})
