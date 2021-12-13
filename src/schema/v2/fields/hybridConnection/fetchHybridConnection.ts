import { Connection, ConnectionArguments } from "graphql-relay"
import { hybridConnectionFromArraySlice } from "./hybridConnectionFromArraySlice"
import { NodeWithCursorMeta } from "./hybridConnectionFromArraySlice"
import { HybridOffsets } from "./hybridOffsets"

/**
 * A fetching function for a given source that can respect standard
 * `limit` `offset` and `sort` arguments.
 */
export type FetcherForLimitAndOffset<U = unknown> = (args: {
  limit: number
  offset: number
  sort: string
}) => Promise<{ nodes: Array<U>; totalCount: number }>

/**
 * Combine the response from multiple sources to return a single relay connection result
 */
export const fetchHybridConnection = async <
  /* string union of source labels */
  K extends string,
  /* the generic nodes themselves */
  T extends Record<string, unknown>,
  /* Additional args that the query may receive */
  A extends { sort?: any }
>({
  args,
  fetchers,
  transform,
}: {
  // The arguments from the relay query
  args: ConnectionArguments & A
  // Fetchers accepting limit/offset/sort for each source using an arbitrary key
  fetchers: Record<K, FetcherForLimitAndOffset<T>>
  // Any transformations to apply to the combined collection (particularly sorting)
  transform?: (
    args: ConnectionArguments & A,
    nodes: T[]
  ) => Array<NodeWithCursorMeta<K, T>>
}): Promise<Connection<T>> => {
  const { first, last, before, after } = args
  // 1. check args
  if (before || last) {
    throw new Error("only first/after args are supported")
  }
  if (!first) {
    throw new Error("Argument 'first' is required")
  }

  const sort = args.sort
  const limit: number = first
  const sources = Object.keys(fetchers)

  // 2. determine offsets by deserializing cursor
  const initialOffsets: HybridOffsets<K> = after
    ? HybridOffsets.decode(after)
    : HybridOffsets.empty(sources)

  // 3. Over-fetch enough to fulfill request from either service
  const requests = sources.map<ReturnType<FetcherForLimitAndOffset<T>>>(
    (source) => {
      const fetcher = fetchers[source]
      return fetcher({
        limit,
        offset: initialOffsets.state[source],
        sort,
      })
    }
  )

  const results = await Promise.all(requests)

  // 4. Sum the total count from all results.
  const totalCount = results.reduce((acc, result) => acc + result.totalCount, 0)

  // 5. Flatten all nodes into a single array and add their source.
  const allNodes: Array<
    T & {
      _cursorMeta: {
        source: K
      }
    }
  > = results.flatMap((resultArray, i) => {
    const source = sources[i]
    const nodes: any[] = resultArray.nodes
    return nodes.map((node) => ({ ...node, _cursorMeta: { source } }))
  })

  // 6. Apply any transforms from the caller (good opportunity to sort).
  const transformedNodes = transform ? transform(args, allNodes) : allNodes

  // 7. Iterate over nodes and increment their offsets.
  let offsets = initialOffsets
  const nodesWithOffsets: Array<NodeWithCursorMeta<K, T>> = []

  transformedNodes.forEach((node) => {
    const source = node._cursorMeta.source
    offsets = offsets.increment(source)

    const nodeWithFullMeta = node as NodeWithCursorMeta<K, T>
    nodeWithFullMeta._cursorMeta.offsets = offsets

    nodesWithOffsets.push(nodeWithFullMeta)
  })

  // 8. Slice the requested number of nodes from the result set.
  const slicedNodes = nodesWithOffsets.slice(0, limit)

  const result = hybridConnectionFromArraySlice({
    nodes: slicedNodes,
    totalCount,
  })
  return result
}
