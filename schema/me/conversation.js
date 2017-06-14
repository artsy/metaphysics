import impulse from "lib/loaders/impulse"
import gravity from "lib/loaders/gravity"

import { GraphQLString, GraphQLNonNull } from "graphql"

import { ConversationType } from "./conversations"

const { IMPULSE_APPLICATION_ID } = process.env

export default {
  type: ConversationType,
  description: "A conversation, usually between a user and a partner",
  args: {
    id: {
      type: new GraphQLNonNull(GraphQLString),
      description: "The ID of the Conversation",
    },
  },
  resolve: (root, { id }, request, { rootValue: { accessToken } }) => {
    if (!accessToken) return null
    return gravity
      .with(accessToken, { method: "POST" })("me/token", {
        client_application_id: IMPULSE_APPLICATION_ID,
      })
      .then(data => {
        return impulse.with(data.token, { method: "GET" })(`conversations/${id}`).then(impulseData => {
          return impulseData
        })
      })
  },
}
