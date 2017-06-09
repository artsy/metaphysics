import impulse from "../../lib/loaders/impulse"
import gravity from "../../lib/loaders/gravity"

import { GraphQLString, GraphQLNonNull } from "graphql"

import { ConversationType } from "./conversations"

const { IMPULSE_APPLICATION_ID } = process.env

export default {
  type: ConversationType,
  description: "A conversation",
  args: {
    id: {
      type: new GraphQLNonNull(GraphQLString),
      description: "The ID of the Conversation",
    },
  },
  resolve: (root, options, request, { rootValue: { accessToken, userID } }) => {
    if (!accessToken) return null

    const id = options.id
    return gravity
      .with(accessToken, { method: "POST" })("me/token", {
        client_application_id: IMPULSE_APPLICATION_ID,
      })
      .then(data => {
        return impulse
          .with(data.token, { method: "GET" })(`conversations/${id}`, {
            from_id: userID,
            from_type: "User",
          })
          .then(impulseData => {
            return impulseData
          })
      })
  },
}
