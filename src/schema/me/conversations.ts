import { pageable } from "relay-cursor-paging"
import { convertConnectionArgsToGravityArgs } from "lib/helpers"
import { GraphQLInt, GraphQLFieldConfig } from "graphql"
import { connectionFromArraySlice, connectionDefinitions } from "graphql-relay"
import { assign } from "lodash"

import { ConversationType } from "./conversation"
import { ResolverContext } from "types/graphql"

const Conversations: GraphQLFieldConfig<void, ResolverContext> = {
  type: connectionDefinitions({
    nodeType: ConversationType,
    connectionFields: {
      totalUnreadCount: {
        type: GraphQLInt,
        resolve: ({ total_unread_count }) => total_unread_count,
      },
    },
  }).connectionType,
  description: "Conversations, usually between a user and partner.",
  args: pageable(),
  resolve: (_root, options, { conversationsLoader }) => {
    if (!conversationsLoader) return null
    const { page, size, offset } = convertConnectionArgsToGravityArgs(options)
    const expand = ["total_unread_count"]
    return conversationsLoader({ page, size, expand }).then(
      ({ total_count, total_unread_count, conversations }) => {
        return assign(
          { total_unread_count },
          connectionFromArraySlice(conversations, options, {
            arrayLength: total_count,
            sliceStart: offset,
          })
        )
      }
    )
  },
}

export default Conversations
