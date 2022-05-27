import { Connection } from "graphql-relay"
import { HybridOffsets } from "./hybridOffsets"

/**
 * A node with an additional `_cursorMeta` property for storing intermediate data
 * used to generate our hybrid cursors
 */
export type NodeWithCursorMeta<
  Keys extends string,
  Node = Record<string, unknown>
> = Node & {
  _cursorMeta: {
    source: Keys
    offsets: HybridOffsets<Keys>
  }
}

/**
 * It's a connectionFromArraySlice where the objects come from multiple sources.
 *
 * Given a slice (subset) of an array, returns a connection object for use in
 * GraphQL.
 *
 * This function is similar to `connectionFromArray`, but is intended for use
 * cases where you know the cardinality of the connection, consider it too large
 * to materialize the entire array, and instead wish pass in a slice of the
 * total result large enough to cover the range specified in `args`.
 */
export function hybridConnectionFromArraySlice<
  K extends string,
  T extends Record<string, unknown>
>({
  nodes: arraySlice,
  totalCount,
}: {
  nodes: Array<NodeWithCursorMeta<K, T>>
  totalCount: number
}): Connection<T> {
  const edges: Array<{
    cursor: string
    node: NodeWithCursorMeta<K, T>
  }> = arraySlice.map((node) => {
    const {
      _cursorMeta: { offsets },
    } = node
    const cursor = offsets.encoded

    return {
      cursor,
      node,
    }
  })

  const firstEdge = edges[0]
  const lastEdge = edges[edges.length - 1]

  const result = {
    totalCount,
    edges,
    pageInfo: {
      startCursor: firstEdge?.cursor ?? null,
      endCursor: lastEdge?.cursor ?? null,
      hasPreviousPage: firstEdge
        ? firstEdge.node._cursorMeta.offsets.position! > 0
        : false,
      hasNextPage: lastEdge
        ? lastEdge.node._cursorMeta.offsets!.position! + 1 < totalCount
        : false,
    },
  }
  return result
}
