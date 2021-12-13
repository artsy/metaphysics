import { pageable } from "relay-cursor-paging"
import { GraphQLFieldConfig } from "graphql"
import { ResolverContext } from "types/graphql"
import { connectionWithCursorInfo } from "schema/v2/fields/pagination"
import {
  ConversationEventUnion,
  fetchOrderEventsForPagination,
} from "./orderEvents"
import { fetchMessagesForPagination } from "./messageEvents"
import { fetchHybridConnection } from "../../../fields/hybridConnection"

export const eventConnection: GraphQLFieldConfig<any, ResolverContext> = {
  description: "Messages and other events in a conversation.",
  type: connectionWithCursorInfo({
    nodeType: ConversationEventUnion,
  }).connectionType,
  args: pageable({}),
  resolve: async (
    parent,
    args,
    ctx: {
      conversationMessagesLoader?: any
      exchangeGraphQLLoader?: any
      userID?: string
    }
  ) => {
    const { id: conversationID } = parent

    const { conversationMessagesLoader, exchangeGraphQLLoader, userID } = ctx
    if (!(conversationMessagesLoader && exchangeGraphQLLoader && userID))
      return null

    // Messages are always served descending from most recent
    args.sort = "DESC"
    const result = await fetchHybridConnection({
      args,
      fetchers: {
        messages: fetchMessagesForPagination(
          conversationID,
          conversationMessagesLoader,
          parent
        ),
        orderEvents: fetchOrderEventsForPagination(
          conversationID,
          userID,
          exchangeGraphQLLoader
        ),
      },
      transform: (args, nodes) => {
        // Sort the nodes before returning the relevant slice
        const sorter =
          args.sort === "DESC"
            ? (a, b) => extractNodeDate(b) - extractNodeDate(a)
            : (a, b) => extractNodeDate(a) - extractNodeDate(b)

        const sortedNodes = nodes.sort(sorter)
        return sortedNodes
      },
    })

    return result
  },
}

const extractNodeDate = (node) => {
  return Date.parse(node["createdAt"] || node["created_at"])
}
