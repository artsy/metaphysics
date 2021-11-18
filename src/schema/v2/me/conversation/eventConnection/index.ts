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

    const result = await fetchHybridConnection({
      args,
      fetchers: {
        msg: fetchMessagesForPagination(
          conversationID,
          conversationMessagesLoader,
          parent
        ),
        ord: fetchOrderEventsForPagination(
          conversationID,
          userID,
          exchangeGraphQLLoader
        ),
      },
      transform: (args, nodes) => {
        // sort the nodes before returning the relevant slice
        const sorter =
          args.sort === "DESC"
            ? (a, b) => extractNodeDate(a) - extractNodeDate(b)
            : (a, b) => extractNodeDate(b) - extractNodeDate(a)

        return nodes.sort(sorter)
      },
    })

    return result
  },
}

const extractNodeDate = (node) => {
  const date = node["createdAt"] || node["created_at"]
  return Date.parse(date)
}
