import {
  GraphQLBoolean,
  GraphQLInt,
  GraphQLObjectType,
  GraphQLString,
  GraphQLNonNull,
  GraphQLList,
} from "graphql"
import { toGlobalId } from "graphql-relay"
import { warn } from "lib/loggers"

const PREFIX = "arrayconnection"

const PageCursor = new GraphQLObjectType({
  name: "PageCursor",
  fields: () => ({
    cursor: {
      type: new GraphQLNonNull(GraphQLString),
    },
    page: {
      type: new GraphQLNonNull(GraphQLInt),
    },
    isCurrent: {
      type: new GraphQLNonNull(GraphQLBoolean),
    },
  }),
})

export const PageCursorsType = new GraphQLObjectType({
  name: "PageCursors",
  fields: () => ({
    first: {
      type: PageCursor,
      description:
        "Optional, may be included in `around` (if current page is near the beginning).",
    },
    last: {
      type: PageCursor,
      description:
        "Optional, may be included in `around` (if current page is near the end).",
    },
    around: {
      type: new GraphQLNonNull(new GraphQLList(new GraphQLNonNull(PageCursor))),
      description: "Always includes current page",
    },
  }),
})

// Returns an opaque cursor for a page.
function pageToCursor(page, currentPage, size) {
  return {
    cursor: toGlobalId(PREFIX, (page - 1) * size - 1),
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
    cursors.push(pageToCursor(page, currentPage, size))
  }
  return cursors
}

export function createPageCursors(
  { page: currentPage, size },
  totalRecords,
  max = 5
) {
  // If max is even, bump it up by 1, and log out a warning.
  if (max % 2 === 0) {
    warn(`Max of ${max} passed to page cursors, using ${max + 1}`)
    max = max + 1
  }

  const totalPages = Math.ceil(totalRecords / size)

  // Degenerate case of no records found.
  if (totalPages === 0) {
    return { around: [pageToCursor(1, 1, size)] }
  }

  if (totalPages <= max) {
    // Collection is short, and `around` includes page 1 and the last page.
    return {
      around: pageCursorsToArray(1, totalPages, currentPage, size),
    }
  } else if (currentPage <= Math.floor(max / 2) + 1) {
    // We are near the beginning, and `around` will include page 1.
    return {
      last: pageToCursor(totalPages, currentPage, size),
      around: pageCursorsToArray(1, max - 1, currentPage, size),
    }
  } else if (currentPage >= totalPages - Math.floor(max / 2)) {
    // We are near the end, and `around` will include the last page.
    return {
      first: pageToCursor(1, currentPage, size),
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
    return {
      first: pageToCursor(1, currentPage, size),
      around: pageCursorsToArray(
        currentPage - offset,
        currentPage + offset,
        currentPage,
        size
      ),
      last: pageToCursor(totalPages, currentPage, size),
    }
  }
}
