// interface PaginatedSourceInput<T> {
//   source: string
//   nodes: Array<T>
// }

import { Connection, ConnectionArguments } from "graphql-relay"
import { sortBy } from "lodash"
import { hybridConnectionFromArraySlice } from "./hybridConnectionFromArraySlice"
import { NodeWMeta } from "./hybridConnectionFromArraySlice"
import { HybridOffsets } from "./hybridOffsets"

// some typical relay pagination args (maybe there is a type for this)
type SortDirection = "ASC" | "DESC"

/**
 * A fetching function for a given source that can respect standard
 * `limit` `offset` and `sort` arguments.
 */
export type FetcherForLimitAndOffset<U = unknown> = (
  limit: number,
  offset: number,
  sort: SortDirection
) => Promise<{ nodes: Array<U>; totalCount: number }>

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
export const fetchHybridConnection = async <
  /* string union of source labels */
  K extends string,
  /* the generic nodes themselves */
  T extends Record<string, unknown>
>(
  { first, last, before, after }: ConnectionArguments,
  fetchers: Record<K, FetcherForLimitAndOffset<T>>
): Promise<Connection<T>> => {
  // 1. check args
  if (before || last) {
    throw new Error(
      "only descending pagination with first/after args are supported"
    )
  }
  if (typeof first === "number") {
    if (first <= 0) {
      throw new Error('Argument "first" must be a non-negative integer')
    }
  } else {
    throw new Error("'first' is required")
  }

  // assume latest messages are coming through first
  // (don't support a sort arg yet - descending only)
  const sort: "ASC" | "DESC" = "DESC"
  const limit: number = first
  const sources = Object.keys(fetchers)

  // 2. determine offsets by deserializing cursor
  const initialOffsets: HybridOffsets<K> = after
    ? HybridOffsets.decode(after)
    : HybridOffsets.empty(sources)

  // 3. overfetch enough to fulfill request from either service
  const requests = sources.map<ReturnType<FetcherForLimitAndOffset<T>>>(
    (source) => {
      return fetchers[source](limit, initialOffsets.state[source], sort)
    }
  )

  const results = await Promise.all(requests)

  // 4. total count can be summed from results
  const totalCount = results.reduce((acc, result) => acc + result.totalCount, 0)

  // 5. flatten all nodes into a single array and add their source.
  const allNodes: Array<{
    _cursorMeta: {
      source: K
    }
  }> = results.flatMap((resultArray, i) => {
    const source = sources[i]
    const nodes: any[] = resultArray.nodes
    return nodes.map((node) => ({ ...node, _cursorMeta: { source } }))
  })

  // 6. sort the nodes (only supports sorting by createdAt/_at key)
  const sorter = (node) => {
    const nodeDate = Date.parse(node["createdAt"] || node["created_at"])
    if (isNaN(nodeDate)) {
      throw new Error(
        "A node didn't have a createdAt or created_at, which is required"
      )
    }

    return sort === "DESC" ? -nodeDate : nodeDate
  }

  const sortedNodes = sortBy(allNodes, sorter)

  // 7. Finally, iterate over nodes and increment their offsets
  let offsets = initialOffsets
  const finalNodes: Array<NodeWMeta<K, T>> = []

  sortedNodes.forEach((node) => {
    const source = node._cursorMeta.source
    offsets = offsets.increment(source)
    const nodeWithFullMeta = node as NodeWMeta<K, T>
    nodeWithFullMeta._cursorMeta.offsets = offsets
    finalNodes.push(nodeWithFullMeta)
  })

  const slicedNodes = finalNodes.slice(0, limit)

  return hybridConnectionFromArraySlice({
    nodes: slicedNodes,
    totalCount,
  })
}
