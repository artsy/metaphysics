import { pageable } from "relay-cursor-paging"
import { GraphQLFieldConfig } from "graphql"
import { ResolverContext } from "types/graphql"
import { connectionWithCursorInfo } from "schema/v2/fields/pagination"
import {
  ConversationEventUnion,
  fetchOrderEventsForPagination,
} from "./orderEvents"
import { fetchMessagesForPagination } from "./messageEvents"
import { fetchHybridConnection } from "./hybridConnection"

/*
TODO: cursors and pagination must be encoded and decoded correctly.
Ids are already encoded with positions.
*/
export const eventConnection: GraphQLFieldConfig<any, ResolverContext> = {
  description: "Messages and other events in a conversation.",
  type: connectionWithCursorInfo({
    nodeType: ConversationEventUnion,
  }).connectionType,
  args: pageable({}),
  //   sort: {
  //     type: new GraphQLEnumType({
  //       name: "sortMessages",
  //       values: {
  //         DESC: { value: "desc" },
  //         ASC: { value: "asc" },
  //       },
  //     }),
  //   },
  // }),
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

    const result = await fetchHybridConnection(args, {
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

    console.log(result)
    return result
  },
}
