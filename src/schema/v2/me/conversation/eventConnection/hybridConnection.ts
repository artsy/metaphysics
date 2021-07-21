import {
  ConnectionArguments,
  Connection,
  ConnectionCursor,
} from "graphql-relay"

// we will position our items using the index in their own collection as well as the combined collection
// Type parameter T refers to labels for each source
export type HybridOffsets<T extends string> = Record<T, number> & {
  /** The offset of the argument in the final, combined collection */
  position: number
}

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
    index: number
    offsets?: HybridOffsets<Keys>
  }
}

const base64 = (str: string) => Buffer.from(str, "utf-8").toString("base64")
const unBase64 = (str: string) => Buffer.from(str, "base64").toString("utf-8")

const PREFIX = "hybrid_connection:"

/**
 * Creates the cursor string from an offset.
 */
export function offsetsToCursor<T extends string>(
  offsets: HybridOffsets<T>
): ConnectionCursor {
  return base64(PREFIX + JSON.stringify(offsets))
}

/**
 * Extracts the offset from the cursor string.
 */
export function cursorToOffsets<T extends string>(
  cursor: ConnectionCursor
): HybridOffsets<T> {
  // drop the prefix and parse the json
  return JSON.parse(unBase64(cursor).split(":")[1])
}

type ArraySliceMetaInfo = {
  sliceStart: number
  arrayLength: number
}

/**
 * Given a slice (subset) of an array, returns a connection object for use in
 * GraphQL.
 *
 * This function is similar to `connectionFromArray`, but is intended for use
 * cases where you know the cardinality of the connection, consider it too large
 * to materialize the entire array, and instead wish pass in a slice of the
 * total result large enough to cover the range specified in `args`.
 */
export function hybridConnectionFromArraySlice<
  T extends Record<string, unknown>,
  S extends string
>(
  arraySlice: Array<NodeWMeta<S, T>>,
  args: ConnectionArguments,
  meta: ArraySliceMetaInfo
): Connection<T> {
  const { after, before, first, last } = args
  const { sliceStart, arrayLength } = meta
  const sliceEnd = sliceStart + arraySlice.length

  let startOffset = Math.max(sliceStart, 0)
  let endOffset = Math.min(sliceEnd, arrayLength)

  // TODO: fix commented-out code left over from graphql-relay-js connection.ts

  // const afterOffset = getOffsetsWithDefault(after, -1)
  // if (0 <= afterOffset && afterOffset < arrayLength) {
  //   startOffset = Math.max(startOffset, afterOffset + 1)
  // }

  // const beforeOffset = getOffsetsWithDefault(before, endOffset)
  // if (0 <= beforeOffset && beforeOffset < arrayLength) {
  //   endOffset = Math.min(endOffset, beforeOffset)
  // }

  if (typeof first === "number") {
    if (first < 0) {
      throw new Error('Argument "first" must be a non-negative integer')
    }

    endOffset = Math.min(endOffset, startOffset + first)
  }
  if (typeof last === "number") {
    if (last < 0) {
      throw new Error('Argument "last" must be a non-negative integer')
    }

    startOffset = Math.max(startOffset, endOffset - last)
  }

  // If supplied slice is too large, trim it down before mapping over it.
  const slice = arraySlice.slice(
    startOffset - sliceStart,
    endOffset - sliceStart
  )

  const edges: Array<{ cursor: string; node: T }> = slice.map((value) => {
    const {
      _cursorMeta: { offsets },
      ...node
    } = value
    const cursor = offsetsToCursor(offsets!)
    console.log("***** Adding cursor from offsets: *****")
    console.log({ cursor, offsets })
    return {
      cursor,
      // FIXME
      node: (node as unknown) as T,
    }
  })

  const firstEdge = edges[0]
  const lastEdge = edges[edges.length - 1]
  // TODO: fix commented-out code left over from graphql-relay-js connection.ts
  // const lowerBound = after != null ? afterOffset + 1 : 0
  // const upperBound = before != null ? beforeOffset : arrayLength
  return {
    edges,
    pageInfo: {
      startCursor: firstEdge ? firstEdge.cursor : null,
      endCursor: lastEdge ? lastEdge.cursor : null,
      hasPreviousPage: true,
      // typeof last === "number" ? startOffset > lowerBound : false,
      hasNextPage: true,
      //  typeof first === "number" ? endOffset < upperBound : false,
    },
  }
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

/**
 * A clumsy function to confirm a cursor decodes to an offsets properly.
 */
const isValidOffsets = (offsets: HybridOffsets<any>) =>
  typeof offsets === "object" &&
  offsets !== null &&
  Object.keys(offsets).includes("position")

/**
 * Given an optional cursor and a default offset, returns the offset
 * to use; if the cursor contains a valid offset, that will be used,
 * otherwise it will be the default.
 */
export function getOffsetsWithDefault<K extends string>(
  cursor: ConnectionCursor | null | void,
  defaultOffsets: HybridOffsets<K>
): HybridOffsets<K> {
  if (typeof cursor !== "string") {
    return defaultOffsets
  }
  const offset = cursorToOffsets(cursor)
  return isValidOffsets(offset) ? offset : defaultOffsets
}
