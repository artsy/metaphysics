import { pageable } from "relay-cursor-paging"
import { parseRelayOptions } from "lib/helpers"
import { connectionFromArraySlice, connectionDefinitions } from "graphql-relay"
import { GraphQLInt } from "graphql"
import { ConversationType } from "./conversation"

const connectionFields = {
  totalCount: {
    type: GraphQLInt,
    resolve: ({ pageInfo }) => pageInfo.totalCount,
  },
}

export default {
  type: connectionDefinitions({ nodeType: ConversationType, connectionFields }).connectionType,
  description: "Conversations, usually between a user and partner.",
  args: pageable(),
  resolve: (root, options, request, { rootValue: { conversationsLoader } }) => {
    if (!conversationsLoader) return null
    const { page, size, offset } = parseRelayOptions(options)
    return conversationsLoader({ page, size }).then(({ total_count, conversations }) => {
      const arrayConn = connectionFromArraySlice(conversations, options, {
        arrayLength: total_count,
        sliceStart: offset,
      })
      arrayConn.pageInfo.totalCount = total_count
      return arrayConn
    })
  },
}
