import { pageable } from "relay-cursor-paging"
import { GraphQLEnumType, GraphQLFieldConfig } from "graphql"
import { ResolverContext } from "types/graphql"
import { connectionWithCursorInfo } from "schema/v2/fields/pagination"
import {
  ConversationEventUnion,
  fetchOrderEventsForPagination,
} from "./orderEvents"
import { fetchMessagesForPagination } from "./messageEvents"
import { fetchForPaginationArgs } from "./combinedPagination"
import { hybridConnectionFromArraySlice } from "./hybridConnection"

/*
TODO: cursors and pagination must be encoded and decoded correctly.
Ids are already encoded with positions.
*/
export const eventConnection: GraphQLFieldConfig<any, ResolverContext> = {
  description: "Messages and other events in a conversation.",
  type: connectionWithCursorInfo({
    nodeType: ConversationEventUnion,
  }).connectionType,
  args: pageable({
    sort: {
      type: new GraphQLEnumType({
        name: "sortMessages",
        values: {
          DESC: { value: "desc" },
          ASC: { value: "asc" },
        },
      }),
    },
  }),
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

    const combinedPaginationResult = await fetchForPaginationArgs(args, {
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
    })

    // console.log(combinedPaginationResult)
    const { nodes, totalCount, totalOffset } = combinedPaginationResult

    // TODO: Assuming everything has worked up to this point, the cursors
    // are probably still not working right.
    const connectionResult = {
      ...hybridConnectionFromArraySlice(nodes, args, {
        totalCount,
      }),
      totalCount,
    }

    return connectionResult
  },
}
