// interface PaginatedSourceInput<T> {
//   source: string
//   nodes: Array<T>
// }

import { ConnectionArguments } from "graphql-relay"
import { sortBy } from "lodash"
import { cursorToOffsets, HybridOffsets, NodeWMeta } from "./hybridConnection"

// some typical relay pagination args (maybe there is a type for this)
type SortDirection = "ASC" | "DESC"

// these keys are arbitrary + used to refer to separate source offsets
type SourceKeys = "msg" | "ord"

/**
 * A fetching function for a given source. Based on the incoming `sortDirection`
 * and `offset` it should return a minimum of `limit` records
 * (or less if the collection cannot fulfill it)
 */
export type PaginatedFetcher = <T = any>(
  limit: number,
  offset: number,
  sort: SortDirection
) => Promise<{ nodes: Array<T>; totalCount: number }>

/**
 * Combine the response from multiple sources to return a single paginated result
 * @param paginationArgs The pagination args
 * @param fetchers an object with keys 'msg' and 'ord' and values that are a fetcher accepting limit/offset args
 * @returns an object that looks like this:
 * ```ts
 * {
 *   totalCount: number
 *   totalOffset: number
 *   nodes: Array<{
 *     // initial node response plus...
 *     id: GlobalId             // id encoding the node's overall position in the collection
 *     meta: {
 *       source: 'msg' | 'ord', // source fetcher
 *       index: number          // position in _that_ fetcher's entire collection
 *     }
 *     offsets: {
 *       ord: number            // last-seen order event (from node.meta.index)
 *       msg: number            // last-seen message event
 *       position: number       // overall position in the paginated collection
 *     }
 *   }>
 * }
 * ```
 */
export const fetchForPaginationArgs = async (
  { first, last, before, after }: ConnectionArguments,
  fetchers: Record<SourceKeys, PaginatedFetcher>
): Promise<{ totalCount: number; nodes: Array<any>; totalOffset: number }> => {
  // 1. check args
  if (before || last) {
    throw new Error(
      "only descending pagination with first/after args are supported"
    )
  }

  // assume latest messages are coming through first (don't support a sort arg yet)
  const sort: "ASC" | "DESC" = "DESC"

  // 2. determine offsets by deserializing cursor
  let offsets: HybridOffsets<SourceKeys> = {
    msg: 0,
    ord: 0,
    position: 0,
  }

  if (after) {
    offsets = cursorToOffsets(after)
  }

  // figure out pagination args - default = 10?
  const limit: number = first || 10

  // 3. overfetch to fulfill request from either service
  const orderEventsReq = fetchers.ord(limit, offsets.ord, sort)
  const messagesReq = fetchers.msg(limit, offsets.msg, sort)
  const [orderEventsResult, messagesResult] = await Promise.all([
    orderEventsReq,
    messagesReq,
  ])

  // combine total counts from each service
  const totalCount = orderEventsResult.totalCount + messagesResult.totalCount

  // 4. Sort and prepare all nodes with ids for cursor pagination
  const allNodes = [
    ...addLocalPositionsToNodes(messagesResult.nodes, "msg", offsets),
    ...addLocalPositionsToNodes(orderEventsResult.nodes, "ord", offsets),
  ]

  const sorter = (node) => {
    const date: number = Date.parse(node["createdAt"])
    return sort === "DESC" ? -date : date
  }

  const sortedNodes = sortBy(allNodes, sorter)

  return {
    ...reduceNodesWithOffsets(sortedNodes, offsets),
    totalCount,
    totalOffset: offsets.position,
  }
  // offsets are indexes of the final collection,
  // so our new objects must pick up where they left off
}

// add what source each node came from as well as its position in the collection
const addLocalPositionsToNodes = (
  nodes: Array<any>,
  source: SourceKeys,
  startingOffsets: HybridOffsets<SourceKeys>
): Array<NodeWMeta<SourceKeys>> => {
  return nodes.reduce((acc, node, index) => {
    const totalIndex = index + startingOffsets[source]
    const meta = { source, index: totalIndex }
    node._cursorMeta = meta
    acc.push(node)
    return acc
  }, [])
}

// add total collection offsets to each node. assume that will wind up in the cursor.
const reduceNodesWithOffsets = <T extends NodeWMeta<SourceKeys>>(
  nodes: Array<T>,
  startingOffsets: HybridOffsets<SourceKeys>
): { nodes: Array<T>; offsets: HybridOffsets<SourceKeys> } => {
  return nodes.reduce(
    (acc, node, index) => {
      const { source: thisSource, index: sourceIndex } = node._cursorMeta
      const newPosition = startingOffsets.position + index
      const newOffsets = {
        ...acc.offsets,
        [thisSource]: sourceIndex,
        position: newPosition,
      }
      console.log({ newOffsets })
      // A bit of mutation here because deep cloning looks much uglier
      node._cursorMeta.offsets = newOffsets
      return {
        nodes: [...acc.nodes, node],
        offsets: newOffsets,
      }
    },
    { nodes: [], offsets: startingOffsets } as {
      nodes: Array<T>
      offsets: HybridOffsets<SourceKeys>
    }
  )
}
