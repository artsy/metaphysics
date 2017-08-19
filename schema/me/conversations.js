import impulse from "lib/loaders/impulse"
import { pageable } from "relay-cursor-paging"
import { parseRelayOptions } from "lib/helpers"
import { connectionFromArraySlice, connectionDefinitions } from "graphql-relay"

import { ConversationType } from "./conversation"

export default {
  type: connectionDefinitions({ nodeType: ConversationType }).connectionType,
  description: "Conversations, usually between a user and partner.",
  args: pageable(),
  resolve: (root, options, request, { rootValue: { impulseTokenLoader, userID } }) => {
    if (!impulseTokenLoader) return null

    const impulseOptions = parseRelayOptions(options)

    return impulseTokenLoader().then(data => {
      return impulse.with(data.token)("conversations", {
        ...impulseOptions,
        from_id: userID,
        from_type: "User",
      }).then(({ conversations }) => {
        return connectionFromArraySlice(conversations, options, {
          arrayLength: conversations.length,
          sliceStart: impulseOptions.offset,
        })
      })
    })
  },
}
