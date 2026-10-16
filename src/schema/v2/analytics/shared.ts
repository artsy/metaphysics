import {
  GraphQLBoolean,
  GraphQLFieldConfigArgumentMap,
  GraphQLInt,
  GraphQLList,
  GraphQLNonNull,
  GraphQLObjectType,
  GraphQLOutputType,
  GraphQLScalarType,
  GraphQLString,
} from "graphql"
import { connectionFromArray, ConnectionArguments } from "graphql-relay"
import { createPageCursors, PageCursorsType } from "schema/v2/fields/pagination"
import { ResolverContext } from "types/graphql"

/**
 * Types that used to come from the stitched Vortex schema. Names and
 * descriptions match what Vortex served, so clients see the same schema
 * whether `USE_UNSTITCHED_VORTEX` is on or off.
 */

// Vortex returns these as JSON numbers; GraphQL clients have always received
// them as strings.
export const BigIntType = new GraphQLScalarType({
  name: "BigInt",
  description:
    "Represents non-fractional signed whole numeric values. Since the value may\nexceed the size of a 32-bit integer, it's encoded as a string.",
  serialize: (value) => String(value),
  parseValue: (value) => String(value),
})

const passThrough = (value) => value

export const ISO8601DateTimeType = new GraphQLScalarType({
  name: "ISO8601DateTime",
  description: "An ISO 8601-encoded datetime",
  serialize: passThrough,
  parseValue: passThrough,
})

export const AnalyticsDateTimeType = new GraphQLScalarType({
  name: "AnalyticsDateTime",
  description: "An ISO 8601 datetime",
  serialize: passThrough,
  parseValue: passThrough,
})

export const AnalyticsPageInfoType = new GraphQLObjectType<
  any,
  ResolverContext
>({
  name: "AnalyticsPageInfo",
  description: "Information about pagination in a connection.",
  fields: {
    endCursor: {
      type: GraphQLString,
      description: "When paginating forwards, the cursor to continue.",
    },
    hasNextPage: {
      type: new GraphQLNonNull(GraphQLBoolean),
      description: "When paginating forwards, are there more items?",
    },
    hasPreviousPage: {
      type: new GraphQLNonNull(GraphQLBoolean),
      description: "When paginating backwards, are there more items?",
    },
    startCursor: {
      type: GraphQLString,
      description: "When paginating backwards, the cursor to continue.",
    },
  },
})

export const analyticsConnectionArgs: GraphQLFieldConfigArgumentMap = {
  after: {
    type: GraphQLString,
    description:
      "Returns the elements in the list that come after the specified cursor.",
  },
  before: {
    type: GraphQLString,
    description:
      "Returns the elements in the list that come before the specified cursor.",
  },
  first: {
    type: GraphQLInt,
    description: "Returns the first _n_ elements from the list.",
  },
  last: {
    type: GraphQLInt,
    description: "Returns the last _n_ elements from the list.",
  },
}

/**
 * The connection shape Vortex's graphql-ruby connections exposed (including
 * `nodes` and the graphql-page_cursors fields), for a node type and the
 * connection/edge type names Vortex used.
 */
export const analyticsConnectionType = ({
  connectionName,
  edgeName,
  nodeName,
  nodeType,
}: {
  connectionName: string
  edgeName: string
  nodeName: string
  nodeType: GraphQLOutputType
}) => {
  const edgeType = new GraphQLObjectType<any, ResolverContext>({
    name: edgeName,
    description: "An edge in a connection.",
    fields: {
      cursor: {
        type: new GraphQLNonNull(GraphQLString),
        description: "A cursor for use in pagination.",
      },
      node: {
        type: nodeType,
        description: "The item at the end of the edge.",
      },
    },
  })

  return new GraphQLObjectType<any, ResolverContext>({
    name: connectionName,
    description: `The connection type for ${nodeName}.`,
    fields: {
      edges: {
        type: new GraphQLList(edgeType),
        description: "A list of edges.",
      },
      nodes: {
        type: new GraphQLList(nodeType),
        description: "A list of nodes.",
        resolve: ({ edges }) => edges.map(({ node }) => node),
      },
      pageCursors: { type: PageCursorsType },
      pageInfo: {
        type: new GraphQLNonNull(AnalyticsPageInfoType),
        description: "Information to aid in pagination.",
      },
      totalCount: { type: GraphQLInt },
      totalPages: { type: GraphQLInt },
    },
  })
}

/**
 * Paginates a full list in memory, the way Vortex did. Page cursors follow
 * graphql-page_cursors: none for a single page, and the page size is `first`
 * or `last`.
 */
export const analyticsConnectionFromArray = <T>(
  items: T[],
  args: ConnectionArguments
) => {
  const connection = connectionFromArray(items, args)
  const totalCount = items.length
  const size = args.first || args.last

  const totalPages =
    totalCount === 0 ? 0 : size ? Math.ceil(totalCount / size) : 1

  let pageCursors: ReturnType<typeof createPageCursors> | null = null
  if (size && totalPages > 1 && connection.edges.length > 0) {
    const offset = items.indexOf(connection.edges[0].node)
    pageCursors = createPageCursors(
      { page: Math.floor(offset / size) + 1, size },
      totalCount
    )
  }

  return { ...connection, pageCursors, totalCount, totalPages }
}
