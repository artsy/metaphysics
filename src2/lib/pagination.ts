import {
  ConnectionArguments,
  connectionFromArraySlice,
  toGlobalId,
} from "graphql-relay"
import { pick } from "lodash"
import { warn } from "lib/loggers"

const PREFIX = "arrayconnection"
const PAGE_NUMBER_CAP = 100

export function pageToCursor(page, size) {
  return toGlobalId(PREFIX, String((page - 1) * size - 1))
}

// Returns an opaque cursor for a page.
function pageToCursorObject(page, currentPage, size) {
  return {
    cursor: pageToCursor(page, size),
    page,
    isCurrent: currentPage === page,
  }
}

// Returns an array of PageCursor objects
// from start to end (page numbers).
function pageCursorsToArray(start, end, currentPage, size) {
  let page
  const cursors = []
  for (page = start; page <= end; page++) {
    // FIXME: Argument of type '{ cursor: string; page: any; isCurrent: boolean; }' is not assignable to parameter of type 'never'.
    // @ts-ignore
    cursors.push(pageToCursorObject(page, currentPage, size))
  }
  return cursors
}

// Returns the total number of pagination results capped to PAGE_NUMBER_CAP if cap value provided.
export function computeTotalPages(
  totalRecords,
  size,
  pageNumberCap: number | null = PAGE_NUMBER_CAP
) {
  const totalPages = Math.ceil(totalRecords / size)
  return pageNumberCap ? Math.min(totalPages, pageNumberCap) : totalPages
}

export function createPageCursors(
  { page: currentPage, size }: { page: number; size: number },
  totalRecords: number,
  max = 5,
  pageNumberCap: number | null = PAGE_NUMBER_CAP
) {
  // If max is even, bump it up by 1, and log out a warning.
  if (max % 2 === 0) {
    warn(`Max of ${max} passed to page cursors, using ${max + 1}`)
    max = max + 1
  }

  const totalPages = computeTotalPages(totalRecords, size, pageNumberCap)

  let pageCursors
  // Degenerate case of no records found.
  if (totalPages === 0) {
    pageCursors = { around: [pageToCursorObject(1, 1, size)] }
  } else if (totalPages <= max) {
    // Collection is short, and `around` includes page 1 and the last page.
    pageCursors = {
      around: pageCursorsToArray(1, totalPages, currentPage, size),
    }
  } else if (currentPage <= Math.floor(max / 2) + 1) {
    // We are near the beginning, and `around` will include page 1.
    pageCursors = {
      last: pageToCursorObject(totalPages, currentPage, size),
      around: pageCursorsToArray(1, max - 1, currentPage, size),
    }
  } else if (currentPage >= totalPages - Math.floor(max / 2)) {
    // We are near the end, and `around` will include the last page.
    pageCursors = {
      first: pageToCursorObject(1, currentPage, size),
      around: pageCursorsToArray(
        totalPages - max + 2,
        totalPages,
        currentPage,
        size
      ),
    }
  } else {
    // We are in the middle, and `around` doesn't include the first or last page.
    const offset = Math.floor((max - 3) / 2)
    pageCursors = {
      first: pageToCursorObject(1, currentPage, size),
      around: pageCursorsToArray(
        currentPage - offset,
        currentPage + offset,
        currentPage,
        size
      ),
      last: pageToCursorObject(totalPages, currentPage, size),
    }
  }

  if (currentPage > 1 && totalPages > 1) {
    pageCursors.previous = pageToCursorObject(
      currentPage - 1,
      currentPage,
      size
    )
  }
  return pageCursors
}

export const paginationResolver = <T>({
  totalCount,
  offset,
  page,
  size,
  body,
  args,
  resolveNode,
}: {
  /** Args object containing either `page/size` or `first/after` */
  args: ConnectionArguments
  /** Returned from loader */
  body: T[]
  /** Returned from `convertConnectionArgsToGravityArgs` */
  offset: number
  /** Returned from `convertConnectionArgsToGravityArgs` */
  page: number
  /** Returned from `convertConnectionArgsToGravityArgs`; "per" */
  size: number
  /** Returned from the 'X-TOTAL-COUNT' header */
  totalCount: number
  /** Optional callback. Allows resolution of custom node structure. */
  resolveNode?: ((node: T) => any) | null
}) => {
  const connectionArgs = {
    // If we're exclusively using page/size pagination, `hasNextPage` will
    // always be `false` unless we include `first` as `size` for creating the connection.
    first: size,
    ...pick(args, "before", "after", "first", "last"),
  }

  return {
    totalCount,
    pageCursors: createPageCursors({ page, size }, totalCount),
    ...connectionFromArraySlice(body, connectionArgs, {
      arrayLength: totalCount,
      sliceStart: offset,
      resolveNode,
    }),
  }
}
