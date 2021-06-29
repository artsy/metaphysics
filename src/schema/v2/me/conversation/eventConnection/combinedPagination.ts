// interface PaginatedSourceInput<T> {
//   source: string
//   nodes: Array<T>
// }

import { sortBy } from "lodash"

// some typical relay pagination args (maybe there is a type for this)
interface PaginationArgs {
  first?: number
  last?: number
  before?: string
  after?: string
}
type SortDirection = "ASC" | "DESC"

// these keys are arbitrary + used to refer to separate source offsets
type PaginatedSource = "msg" | "ord"
// we will position our items using the index in their own collection as well as the combined collection
type PaginatedOffsets = Record<PaginatedSource, number> & { position: number }
type PaginatedFetcher = <T = any>(
  limit: number,
  offset: number,
  sort: SortDirection
) => Promise<{ nodes: Array<T>; totalCount: number }>

// const encodeBase64 = (str: string) =>
//   Buffer.from(str, "utf-8").toString("base64")
const decodeBase64 = (str: string) =>
  Buffer.from(str, "base64").toString("base64")

// Serialize an offset to a string
const serializeOffsets = (offsets: PaginatedOffsets) => {
  return JSON.stringify(offsets)
}
const deserializeOffsets = (cursor: string): PaginatedOffsets => {
  return JSON.parse(cursor)
}

// INLINED FOR NOW
// const paginationOffsets = ({
//   after,
//   before,
// }: PaginationArgs): Record<PaginatedSource, number> => {
//   if (after) {
//     const decoded = decodeBase64(after)
//     const offsets = deserializeOffsets(decoded)
//     return offsets
//   } else if (before) {
//     throw new Error("'before' pagination not implemented")
//   } else {
//     // no cursor no offset
//     return {
//       msg: 0,
//       ord: 0,
//     }
//   }
// }

export const fetchForPaginationArgs = async (
  { first, last, before, after }: PaginationArgs,
  fetchers: Record<PaginatedSource, PaginatedFetcher>
) => {
  // 1. check args
  if (before || last) {
    throw new Error(
      "only descending pagination with first/after args are supported"
    )
  }

  // assume latest messages are coming through first (don't support a sort arg yet)
  const sort: "ASC" | "DESC" = "DESC"

  // 2. determine offsets by deserializing cursor
  let offsets: PaginatedOffsets = {
    msg: 0,
    ord: 0,
    position: 0,
  }

  if (after) {
    const decoded = decodeBase64(after)
    offsets = deserializeOffsets(decoded)
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

  // assemble our source nodes into an object
  const sourceNodes: Record<PaginatedSource, Array<any>> = {
    msg: addLocalPositionsToNodes(messagesResult.nodes, "msg", offsets),
    ord: addLocalPositionsToNodes(orderEventsResult.nodes, "ord", offsets),
  }

  // 4. Sort and prepare all nodes with ids for cursor pagination
  const allNodes = Object.values(sourceNodes).reduce<any[]>(
    (acc, collection) => {
      return [...acc, ...collection]
    },
    []
  )

  const sorter = (node) => {
    const date = new Date(node["createdAt"])
    return sort === "DESC" ? -date : date
  }

  const sortedNodes = sortBy(allNodes, sorter)

  return {
    ...reduceNodesWithOffsets(sortedNodes, offsets),
    totalCount,
  }
  // offsets are indexes of the final collection,
  // so our new objects must pick up where they left off
}

// add what source each node came from as well as its position in the collection
const addLocalPositionsToNodes = (
  nodes: Array<any>,
  source: PaginatedSource,
  startingOffsets: PaginatedOffsets
) => {
  return nodes.reduce((acc, node, index) => {
    const totalIndex = index + startingOffsets[source]
    const meta = { source, index: totalIndex }
    node.meta = meta
    acc.push(node)
    return acc
  })
}

// add total collection offsets to each node. assume that will wind up in the cursor.
const reduceNodesWithOffsets = (
  nodes: Array<any>,
  startingOffsets: PaginatedOffsets
) => {
  return nodes.reduce(
    (acc, node, index) => {
      const { source: thisSource, index: sourceIndex } = node.meta
      const newPosition = startingOffsets.position + index
      const newOffsets = {
        ...acc.offsets,
        [thisSource]: sourceIndex,
        position: newPosition,
      }
      const globalId = JSON.stringify(newOffsets)
      const newNode = { ...node, id: globalId }
      return {
        nodes: [...acc.nodes, newNode],
        offsets: newOffsets,
      }
    },
    { nodes: [], offsets: startingOffsets }
  )
}
