import { pageable } from "relay-cursor-paging"
import { connectionFromArraySlice } from "graphql-relay"

import { GraphQLEnumType, GraphQLFieldConfig } from "graphql"
import { ResolverContext } from "types/graphql"
import { connectionWithCursorInfo } from "schema/v2/fields/pagination"
import { sortBy } from "lodash"
import { ConversationEventUnion, fetchOrderEvents } from "./orderEvents"
import { fetchMessageEvents, prepareConversationArgs } from "./messageEvents"

/*
TODO: Make pagination work
TODO: account for sorting or remove this arg

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
    const { id: conversationId } = parent

    const { conversationMessagesLoader, exchangeGraphQLLoader, userID } = ctx
    if (!(conversationMessagesLoader && exchangeGraphQLLoader && userID))
      return null

    // Fetch all events for conversation because we will need them no matter what
    // TODO: possible refactor - fetchConversationOrderEvents & fetchConversationMessageEvents have slightly different
    //   signatures - optional properties, which means we call them differently.
    const orderEvents: Array<any> = await fetchOrderEvents(conversationId, {
      exchangeGraphQLLoader,
      userID,
    })

    // add a simple indexed id to events to make then node-like
    const orderEventsWithId = orderEvents.map((event, index) => {
      return { ...event, id: String(index) }
    })

    const relayConnectionArgs = prepareConversationArgs(parent, args)

    const {
      totalMessageCount,
      messages,
      messagesOffset,
    } = await fetchMessageEvents(
      conversationId,
      parent,
      { conversationMessagesLoader },
      relayConnectionArgs
    )
    // Total node count is events + messages
    const combinedLength = totalMessageCount + orderEvents.length

    // Big  section: Prepare cursors in the form "prevEvent:eventID:prevMessage:messageID"
    // 'input' might be nodes and sorter
    const sourceNodes: Array<{
      source: string
      nodes: Array<{ id: string }>
    }> = [
      { source: "OrderEvent", nodes: orderEventsWithId },
      { source: "Message", nodes: messages },
    ]
    const sorter = (event: any) => new Date(event["createdAt"])

    // all `source` keys specified above will become part of a serialized id- collect them here
    const globalIdKeys: string[] = sourceNodes.reduce<string[]>(
      (acc, current) => {
        return [...acc, current["source"]]
      },
      []
    )

    // now combine and sort the nodes, identifying each type
    const allNodes = sourceNodes.reduce<any[]>((acc, collection) => {
      const { source, nodes } = collection
      // add a `meta` so we can track what collection the node came from and its original id
      const collectionWithMeta = nodes.map((node) => {
        return { ...node, meta: { source, id: node.id } }
      })
      return [...acc, ...collectionWithMeta]
    }, [])
    const sortedNodes = sortBy(allNodes, sorter)

    const { nodes } = sortedNodes.reduce<any>(
      (acc, node) => {
        const { source: thisSource, id: thisId } = node.meta
        const newPrevious = { ...acc.previous, [thisSource]: thisId }
        // iterate over our source keys and construct a new global id for this key.
        const globalId = globalIdKeys
          .reduce<string[]>((acc, key) => {
            const prevId = newPrevious[key]
            const idChunk = `${key}-${prevId}`
            return [...acc, idChunk]
          }, [])
          .join(":")
        const newNode = { ...node, id: globalId }
        return {
          nodes: [...acc.nodes, newNode],
          previous: newPrevious,
        }
      },
      { nodes: [], previous: {} }
    )

    // now we need to decode the nodes
    console.log(nodes)
    // and also we cannot return connectionFromArraySlice because it will not give us our custom node cursors.
    // const x = connectionFromArraySlice(allConversationEvents, args, {
    //   arrayLength: combinedLength,
    //   sliceStart: messagesOffset,
    // })
    // console.log(x)
    return {
      ...connectionFromArraySlice(nodes, args, {
        arrayLength: combinedLength,
        sliceStart: messagesOffset,
      }),
      totalCount: combinedLength,
    }
  },
}
