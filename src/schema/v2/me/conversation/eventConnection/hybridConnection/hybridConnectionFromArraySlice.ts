import { Connection } from "graphql-relay"
import { HybridOffsets } from "./hybridOffsets"

/**
 * A node with an additional `_cursorMeta` property for storing intermediate data
 * used to generate our hybrid cursors
 */
export type NodeWMeta<
  Keys extends string,
  Node = Record<string, unknown>
> = Node & {
  _cursorMeta: {
    source: Keys
    offsets: HybridOffsets<Keys>
  }
}

/**
 * TODO: update docs. It's a connectionFromArraySlice where the objects come from multiple sources.
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
  nodes: Array<NodeWMeta<K, T>>
  totalCount: number
}): Connection<T> {
  const edges: Array<{
    cursor: string
    node: NodeWMeta<K, T>
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
    edges,
    pageInfo: {
      startCursor: firstEdge ? firstEdge.cursor : null,
      endCursor: lastEdge ? lastEdge.cursor : null,
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

// /**
//  * Return the cursor associated with an object in an array.
//  */
// export function cursorForObjectInConnection<T>(
//   data: $ReadOnlyArray<T>,
//   object: T
// ): ConnectionCursor | null {
//   const offset = data.indexOf(object)
//   if (offset === -1) {
//     return null
//   }
//   return offsetToCursor(offset)
// }

// /**
//  * A clumsy function to confirm a cursor decodes to an offsets properly.
//  */
// const isValidOffsets = (offsets: HybridOffsets<any>) =>
//   typeof offsets === "object" &&
//   offsets !== null &&
//   Object.keys(offsets).includes("position")

/**
 * Given an optional cursor and a default offset, returns the offset
 * to use; if the cursor contains a valid offset, that will be used,
 * otherwise it will be the default.
 */
// export function getOffsetsWithDefault<K extends string>(
//   cursor: ConnectionCursor | null | void,
//   defaultOffsets: HybridOffsets<K>
// ): HybridOffsets<K> {
//   if (typeof cursor !== "string") {
//     return defaultOffsets
//   }
//   const offset = cursorToOffsets(cursor)
//   return isValidOffsets(offset) ? offset : defaultOffsets
// }
