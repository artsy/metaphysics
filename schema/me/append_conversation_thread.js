import impulse from "lib/loaders/impulse"
import gravity from "lib/loaders/gravity"
import { GraphQLString, GraphQLNonNull, GraphQLList, GraphQLObjectType } from "graphql"
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
    to: {
      type: new GraphQLList(GraphQLString),
      description: "An array of email addresses that the message should be sent to",
    },
    message_body: {
      type: new GraphQLNonNull(GraphQLString),
    },
  },
  outputFields: {
    message: {
      type: MessagePayloadType,
      resolve: message => message,
    },
  },
  mutateAndGetPayload: ({ id, from, to, message_body }, request, { rootValue: { accessToken } }) => {
    if (!accessToken) return null
    return gravity
      .with(accessToken, { method: "POST" })("me/token", {
        client_application_id: IMPULSE_APPLICATION_ID,
      })
      .then(data => {
        return Promise.resolve(
          impulse.with(data.token, { method: "POST" })(`conversations/${id}/messages`, {
            to,
            from,
            body_text: message_body,
          })
        ).then(message => message)
      })
  },
})
