import { pageable } from "relay-cursor-paging"
import { connectionFromArraySlice } from "graphql-relay"

import { GraphQLEnumType, GraphQLFieldConfig } from "graphql"
import { ResolverContext } from "types/graphql"
import { connectionWithCursorInfo } from "schema/v2/fields/pagination"
import { sortBy } from "lodash"
import {
  ConversationEventUnion,
  fetchConversationOrderEvents,
} from "./conversationOrderEvents"
import {
  fetchConversationMessageEvents,
  prepareConversationArgs,
} from "./conversationMessageEvents"

/*
TODO: Make pagination work
TODO: account for sorting or remove this arg

*/

export const conversationEventConnection: GraphQLFieldConfig<
  any,
  ResolverContext
> = {
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
  resolve: (
    parent,
    args,
    ctx: {
      conversationMessagesLoader?: any
      exchangeLoader?: any
      userID?: string
    }
  ) => {
    const { id: conversationId } = parent

    const { conversationMessagesLoader } = ctx
    if (!conversationMessagesLoader) return null

    // Fetch all events for conversation because we will need them no matter what
    const orderEventRequest = fetchConversationOrderEvents(conversationId, ctx)

    const argsWithBefore = prepareConversationArgs(parent, args)

    const messagesRequest = fetchConversationMessageEvents(
      conversationId,
      parent,
      { conversationMessagesLoader },
      argsWithBefore
    )

    return Promise.all([orderEventRequest, messagesRequest]).then(
      ([orderEventNodes, { totalMessageCount, messages, messagesOffset }]) => {
        const combinedLength = totalMessageCount + orderEventNodes.length

        // Combine events + messages and sort by date
        const allConversationEvents = sortBy(
          [...messages, ...orderEventNodes],
          (event) => {
            const date = new Date(event.createdAt!)
            return date
          }
        )

        const x = connectionFromArraySlice(allConversationEvents, args, {
          arrayLength: combinedLength,
          sliceStart: messagesOffset,
        })
        console.log(x)
        return {
          ...connectionFromArraySlice(allConversationEvents, args, {
            arrayLength: combinedLength,
            sliceStart: messagesOffset,
          }),
          totalCount: combinedLength,
        }
      }
    )
  },
}
