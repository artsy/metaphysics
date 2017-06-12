import impulse from "lib/loaders/impulse"
import gravity from "lib/loaders/gravity"
import { pageable } from "relay-cursor-paging"
import { parseRelayOptions } from "lib/helpers"
import { connectionFromArraySlice, connectionDefinitions } from "graphql-relay"
import { ConversationType } from "./conversation"
const { IMPULSE_APPLICATION_ID } = process.env

export default {
  type: connectionDefinitions({ nodeType: ConversationType }).connectionType,
  decription: "Conversations, usually between a user and partner.",
  args: pageable(),
  resolve: (root, options, request, { rootValue: { accessToken, userID } }) => {
    if (!accessToken) return null

    const impulseOptions = parseRelayOptions(options)

    return gravity
      .with(accessToken, { method: "POST" })("me/token", {
        client_application_id: IMPULSE_APPLICATION_ID,
      })
      .then(data => {
        return impulse
          .with(data.token)("conversations", {
            ...impulseOptions,
            from_id: userID,
            from_type: "User",
          })
          .then(impulseData => {
            return connectionFromArraySlice(impulseData.conversations, options, {
              arrayLength: impulseData.conversations.length,
              sliceStart: impulseOptions.offset,
            })
          })
      })
  },
}
