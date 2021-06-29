// interface PaginatedSourceInput<T> {
//   source: string
//   nodes: Array<T>
// }

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
) => Promise<T>

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

export const fetchForPaginationArgs = (
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

  // overfetch to fulfill request from either service
  const orderEvents = fetchers.ord(limit, offsets.ord, sort)
  const messages = fetchers.msg(limit, offsets.msg, sort)

  // offsets are indexes of the final collection,
  // so our new objects must pick up where they left off
}

/**
 * Prepare nodes from various sources for combined pagination
 * (with nicely serialized ids)
 */
export function preparePaginationNodes<U extends { id: string }>(
  sources: Array<PaginatedSourceInput>
) {}

/**
 * a module for building a paginated relay connection from a list composed of multiple sources
 */
