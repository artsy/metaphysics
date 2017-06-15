import impulse from "lib/loaders/impulse"
import gravity from "lib/loaders/gravity"
import { pageable } from "relay-cursor-paging"
import { parseRelayOptions } from "lib/helpers"
import { connectionFromArraySlice, connectionDefinitions } from "graphql-relay"
const { IMPULSE_APPLICATION_ID } = process.env

import { ConversationType } from "./conversation"

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
          .then(({ conversations }) => {
            return connectionFromArraySlice(conversations, options, {
              arrayLength: conversations.length,
              sliceStart: impulseOptions.offset,
            })
          })
      })
  },
}
