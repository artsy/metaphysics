import {
  GraphQLBoolean,
  GraphQLEnumType,
  GraphQLFieldConfig,
  GraphQLFieldConfigArgumentMap,
  GraphQLFieldConfigMap,
  GraphQLInt,
  GraphQLList,
  GraphQLNonNull,
  GraphQLObjectType,
  GraphQLOutputType,
  GraphQLScalarType,
  GraphQLString,
} from "graphql"
import { connectionFromArray, ConnectionArguments } from "graphql-relay"
import { snakeCase } from "lodash"
import { createPageCursors, PageCursorsType } from "schema/v2/fields/pagination"
import { ResolverContext } from "types/graphql"

/**
 * Types that used to come from the stitched Vortex schema. Names and
 * descriptions match what Vortex served, so clients saw no schema change when
 * it was unstitched.
 */

/**
 * Vortex's REST API responds in snake_case, so each field reads its snake_case
 * key unless it has its own resolver.
 */
export const snakeCaseFields = (
  fields: Record<string, GraphQLFieldConfig<any, ResolverContext>>
): GraphQLFieldConfigMap<any, ResolverContext> =>
  Object.fromEntries(
    Object.entries(fields).map(([name, config]) => {
      const key = snakeCase(name)
      return [name, { resolve: (source) => source[key], ...config }]
    })
  )

/**
 * Vortex's `QueryPeriodEnum`, also used by Gravity's
 * `analytics_page_time_frame`, hence the lowercase internal values. Vortex's
 * REST API takes and keys responses by the enum names.
 */
export const AnalyticsQueryPeriodEnumType = new GraphQLEnumType({
  name: "AnalyticsQueryPeriodEnum",
  values: {
    FOUR_WEEKS: {
      value: "four_weeks",
      description: "Four weeks",
    },
    SIXTEEN_WEEKS: {
      value: "sixteen_weeks",
      description: "Sixteen weeks",
    },
    ONE_YEAR: {
      value: "one_year",
      description: "One year",
    },
  },
})

// Vortex returns these as JSON numbers; GraphQL clients have always received
// them as strings.
export const BigIntType = new GraphQLScalarType({
  name: "BigInt",
  description:
    "Represents non-fractional signed whole numeric values. Since the value may\nexceed the size of a 32-bit integer, it's encoded as a string.",
  serialize: (value) => String(value),
  parseValue: (value) => String(value),
})

// The arguments the stitched `amount` SDL declared, without descriptions or
// `disambiguate`.
export const stitchedAmountArgs: GraphQLFieldConfigArgumentMap = {
  decimal: { type: GraphQLString, defaultValue: "." },
  format: { type: GraphQLString, defaultValue: "%s%v" },
  precision: { type: GraphQLInt, defaultValue: 0 },
  symbol: { type: GraphQLString },
  thousand: { type: GraphQLString, defaultValue: "," },
}

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
 * `nodes` and, unless `pageCursors` is false, the graphql-page_cursors
 * fields), for a node type and the connection/edge type names Vortex used.
 */
export const analyticsConnectionType = ({
  connectionName,
  edgeName,
  nodeName,
  nodeType,
  pageCursors = true,
}: {
  connectionName: string
  edgeName: string
  nodeName: string
  nodeType: GraphQLOutputType
  pageCursors?: boolean
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
      pageInfo: {
        type: new GraphQLNonNull(AnalyticsPageInfoType),
        description: "Information to aid in pagination.",
      },
      ...(pageCursors
        ? {
            pageCursors: { type: PageCursorsType },
            totalCount: { type: GraphQLInt },
            totalPages: { type: GraphQLInt },
          }
        : {}),
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
