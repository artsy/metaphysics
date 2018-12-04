import {
  GraphQLBoolean,
  GraphQLInt,
  GraphQLObjectType,
  GraphQLString,
  GraphQLNonNull,
  GraphQLList,
} from "graphql"
import { connectionDefinitions, toGlobalId } from "graphql-relay"
import { warn } from "lib/loggers"

const PREFIX = "arrayconnection"

// In most cases Gravity caps the pagination results to 100 pages and we may not want to return more than that
// otherwise we'll generate links that do not work. As of writing there are three endpoints that do this:
//
// * https://github.com/artsy/gravity/blob/52635528/app/api/v1/filter_endpoint.rb#L38
// * https://github.com/artsy/gravity/blob/52635528/app/api/v1/filter_endpoint.rb#L79
// * https://github.com/artsy/gravity/blob/52635528/app/api/v1/partners_endpoint.rb#L168
//
const PAGE_NUMBER_CAP = 100

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
    previous: { type: PageCursor },
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

// Returns the total number of pagination results capped to PAGE_NUMBER_CAP.
export function computeTotalPages(totalRecords, size) {
  return Math.min(Math.ceil(totalRecords / size), PAGE_NUMBER_CAP)
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

  const totalPages = computeTotalPages(totalRecords, size)

  let pageCursors
  // Degenerate case of no records found.
  if (totalPages === 0) {
    pageCursors = { around: [pageToCursor(1, 1, size)] }
  } else if (totalPages <= max) {
    // Collection is short, and `around` includes page 1 and the last page.
    pageCursors = {
      around: pageCursorsToArray(1, totalPages, currentPage, size),
    }
  } else if (currentPage <= Math.floor(max / 2) + 1) {
    // We are near the beginning, and `around` will include page 1.
    pageCursors = {
      last: pageToCursor(totalPages, currentPage, size),
      around: pageCursorsToArray(1, max - 1, currentPage, size),
    }
  } else if (currentPage >= totalPages - Math.floor(max / 2)) {
    // We are near the end, and `around` will include the last page.
    pageCursors = {
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
    pageCursors = {
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

  if (currentPage > 1 && totalPages > 1) {
    pageCursors.previous = pageToCursor(currentPage - 1, currentPage, size)
  }
  return pageCursors
}

export function connectionWithCursorInfo(type) {
  return connectionDefinitions({
    nodeType: type,
    connectionFields: {
      pageCursors: {
        type: PageCursorsType,
        resolve: ({ pageCursors }) => pageCursors,
      },
      totalCount: {
        type: GraphQLInt,
        resolve: ({ totalCount }) => totalCount,
      },
    },
  }).connectionType
}
