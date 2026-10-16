import {
  GraphQLBoolean,
  GraphQLEnumType,
  GraphQLFieldConfig,
  GraphQLFieldConfigArgumentMap,
  GraphQLFloat,
  GraphQLInt,
  GraphQLList,
  GraphQLNonNull,
  GraphQLObjectType,
  GraphQLOutputType,
  GraphQLResolveInfo,
  GraphQLString,
  GraphQLUnionType,
} from "graphql"
import {
  parseResolveInfo,
  ResolveTree,
  simplifyParsedResolveInfoFragmentWithType,
} from "graphql-parse-resolve-info"
import { connectionFromArray } from "graphql-relay"
import { pick, snakeCase } from "lodash"
import { tokenIfPropagatable } from "lib/apis/vortex"
import {
  PartnerStatsKey,
  PartnerStatsSection,
} from "lib/loaders/vortexPartnerStatsLoader"
import { amount } from "schema/v2/fields/money"
import { ResolverContext } from "types/graphql"
import {
  AnalyticsDateTimeType,
  analyticsConnectionArgs,
  analyticsConnectionType,
  AnalyticsQueryPeriodEnumType,
  snakeCaseFields,
} from "./shared"

/**
 * `Partner.analytics` and `User.analytics`, served from Vortex's REST API.
 * They replace the fields the stitched Vortex schema added, with the same
 * types, and are only mounted when `USE_UNSTITCHED_VORTEX` is on.
 */

// Vortex REST is authorized like the stitched Vortex link was: with the
// user's Gravity-minted Vortex token, unless the request carries an app token
// that may be passed on (an email provider's) or has no user, in which case
// the unauthenticated loaders send that app token or Metaphysics' own.
export const vortexStatsLoader = <
  Name extends "vortexPartnerStatsLoader" | "vortexUserStatsLoader"
>(
  { authenticatedLoaders, unauthenticatedLoaders, appToken }: ResolverContext,
  name: Name
) => {
  const userTokenLoader = authenticatedLoaders?.[name]
  return userTokenLoader && !tokenIfPropagatable(appToken)
    ? userTokenLoader
    : unauthenticatedLoaders[name]
}

// e.g. "four_weeks" (the enum's internal value) -> "FOUR_WEEKS"
const periodName = (period: string) => period.toUpperCase()

const periodArgs: GraphQLFieldConfigArgumentMap = {
  period: { type: new GraphQLNonNull(AnalyticsQueryPeriodEnumType) },
}

const periodField = {
  type: new GraphQLNonNull(AnalyticsQueryPeriodEnumType),
}

const partnerIdField = { type: new GraphQLNonNull(GraphQLString) }

// The arguments the stitched `amount` SDL declared, without descriptions or
// `disambiguate`.
const totalField: GraphQLFieldConfig<any, ResolverContext> = {
  type: GraphQLString,
  args: {
    decimal: { type: GraphQLString, defaultValue: "." },
    format: { type: GraphQLString, defaultValue: "%s%v" },
    precision: { type: GraphQLInt, defaultValue: 0 },
    symbol: { type: GraphQLString },
    thousand: { type: GraphQLString, defaultValue: "," },
  },
  resolve: ({ total_cents }, args) =>
    amount(() => total_cents).resolve({}, args),
}

const timeSeriesStatsType = (name: string, description?: string) =>
  new GraphQLObjectType<any, ResolverContext>({
    name,
    description,
    fields: snakeCaseFields({
      count: { type: GraphQLInt },
      endTime: { type: AnalyticsDateTimeType },
      startTime: { type: AnalyticsDateTimeType },
    }),
  })

// Vortex's REST time series are never cumulative; `cumulative: true` is a
// running sum of `valueKey` over the buckets, as Vortex's GraphQL computed it.
const timeSeriesField = (
  type: GraphQLOutputType,
  {
    description,
    valueKey = "count",
  }: { description: string; valueKey?: string }
): GraphQLFieldConfig<any, ResolverContext> => ({
  type,
  description,
  args: {
    cumulative: { type: GraphQLBoolean, defaultValue: false },
  },
  resolve: ({ time_series }, { cumulative }) => {
    if (!time_series || !cumulative) return time_series

    let sum = 0
    return time_series.map((bucket) => {
      sum += bucket[valueKey] ?? 0
      return { ...bucket, [valueKey]: sum }
    })
  },
})

const PartnerTimeSeriesStatsType = timeSeriesStatsType(
  "AnalyticsPartnerTimeSeriesStats",
  "Partner Time Series Stats"
)

const PartnerSalesTimeSeriesStatsType = new GraphQLObjectType<
  any,
  ResolverContext
>({
  name: "AnalyticsPartnerSalesTimeSeriesStats",
  description: "Sales time series data of a partner",
  fields: snakeCaseFields({
    // Vortex never had a count for sales buckets.
    count: { type: GraphQLInt, resolve: () => null },
    endTime: { type: AnalyticsDateTimeType },
    startTime: { type: AnalyticsDateTimeType },
    total: totalField,
    totalCents: { type: new GraphQLNonNull(GraphQLInt) },
  }),
})

const PartnerSalesStatsType = new GraphQLObjectType<any, ResolverContext>({
  name: "AnalyticsPartnerSalesStats",
  description: "Sales stats of a partner",
  fields: snakeCaseFields({
    orderCount: { type: new GraphQLNonNull(GraphQLInt) },
    orderResponseRate: {
      type: GraphQLFloat,
      description:
        "Percentage (0-100) of orders/offers the partner responded to",
    },
    orderResponseTime: {
      type: GraphQLInt,
      description: "Order response time in seconds",
    },
    partnerId: partnerIdField,
    period: periodField,
    timeSeries: timeSeriesField(
      new GraphQLList(new GraphQLNonNull(PartnerSalesTimeSeriesStatsType)),
      { description: "Partner sales time series", valueKey: "total_cents" }
    ),
    total: totalField,
    totalCents: { type: new GraphQLNonNull(GraphQLInt) },
  }),
})

const PartnerInquiryCountTimeSeriesStatsType = timeSeriesStatsType(
  "AnalyticsPartnerInquiryCountTimeSeriesStats",
  "Inquiry count time series data of a partner"
)

const PartnerInquiryStatsType = new GraphQLObjectType<any, ResolverContext>({
  name: "AnalyticsPartnerInquiryStats",
  description: "Inquiry stats of a partner",
  fields: snakeCaseFields({
    inquiryCount: { type: new GraphQLNonNull(GraphQLInt) },
    inquiryResponseTime: {
      type: GraphQLInt,
      description: "Inquiry response time in seconds",
    },
    partnerId: partnerIdField,
    period: periodField,
    timeSeries: timeSeriesField(
      new GraphQLList(
        new GraphQLNonNull(PartnerInquiryCountTimeSeriesStatsType)
      ),
      { description: "Partner inquiry count time series" }
    ),
  }),
})

const PartnerAudienceStatsType = new GraphQLObjectType<any, ResolverContext>({
  name: "AnalyticsPartnerAudienceStats",
  description: "Audience stats of a partner",
  fields: snakeCaseFields({
    commercialVisitors: { type: new GraphQLNonNull(GraphQLInt) },
    commercialVisitorsPercentageChanged: {
      type: new GraphQLNonNull(GraphQLInt),
    },
    partnerId: partnerIdField,
    period: periodField,
    uniqueVisitors: { type: new GraphQLNonNull(GraphQLInt) },
    uniqueVisitorsPercentageChanged: { type: new GraphQLNonNull(GraphQLInt) },
  }),
})

const PartnerStatsPageviewsTimeSeriesType = timeSeriesStatsType(
  "AnalyticsPartnerStatsPageviewsTimeSeries",
  "Pageviews time series data of a partner"
)

const PartnerStatsPageviewsType = new GraphQLObjectType<any, ResolverContext>({
  name: "AnalyticsPartnerStatsPageviews",
  description: "Stats for pageviews of partner content",
  fields: snakeCaseFields({
    artworkViews: { type: new GraphQLNonNull(GraphQLInt) },
    galleryViews: { type: new GraphQLNonNull(GraphQLInt) },
    partnerId: partnerIdField,
    percentageChanged: { type: new GraphQLNonNull(GraphQLInt) },
    period: periodField,
    showViews: { type: new GraphQLNonNull(GraphQLInt) },
    timeSeries: timeSeriesField(
      new GraphQLList(new GraphQLNonNull(PartnerStatsPageviewsTimeSeriesType)),
      { description: "Pageviews time series" }
    ),
    totalCount: { type: new GraphQLNonNull(GraphQLInt) },
    uniqueVisitors: { type: new GraphQLNonNull(GraphQLInt) },
  }),
})

const legacyTimeSeriesField = {
  type: new GraphQLNonNull(
    new GraphQLList(new GraphQLNonNull(PartnerTimeSeriesStatsType))
  ),
}

const PageviewStatsType = new GraphQLObjectType<any, ResolverContext>({
  name: "AnalyticsPageviewStats",
  description: "Stats for pageviews of partner content",
  fields: snakeCaseFields({
    artworkViews: { type: GraphQLInt },
    galleryViews: { type: GraphQLInt },
    percentageChanged: { type: new GraphQLNonNull(GraphQLInt) },
    period: periodField,
    showViews: { type: GraphQLInt },
    timeSeries: legacyTimeSeriesField,
    totalCount: { type: new GraphQLNonNull(GraphQLInt) },
    uniqueVisitors: { type: GraphQLInt },
  }),
})

const PartnerStatsArtworksPublishedTimeSeriesType = timeSeriesStatsType(
  "AnalyticsPartnerStatsArtworksPublishedTimeSeries",
  "Artworks published time series data of a partner"
)

const PartnerStatsArtworksPublishedType = new GraphQLObjectType<
  any,
  ResolverContext
>({
  name: "AnalyticsPartnerStatsArtworksPublished",
  description: "Publish artwork Series Stats",
  fields: snakeCaseFields({
    partnerId: partnerIdField,
    percentageChanged: { type: new GraphQLNonNull(GraphQLInt) },
    period: periodField,
    timeSeries: timeSeriesField(
      new GraphQLNonNull(
        new GraphQLList(
          new GraphQLNonNull(PartnerStatsArtworksPublishedTimeSeriesType)
        )
      ),
      { description: "Partner artworks published count time series" }
    ),
    totalCount: { type: new GraphQLNonNull(GraphQLInt) },
  }),
})

const ArtworksPublishedStatsType = new GraphQLObjectType<any, ResolverContext>({
  name: "AnalyticsArtworksPublishedStats",
  description: "Publish artwork Series Stats",
  fields: snakeCaseFields({
    percentageChanged: { type: new GraphQLNonNull(GraphQLInt) },
    period: periodField,
    timeSeries: legacyTimeSeriesField,
    totalCount: { type: new GraphQLNonNull(GraphQLInt) },
  }),
})

// Ranked stats

const RankedStatsObjectTypeEnum = new GraphQLEnumType({
  name: "AnalyticsRankedStatsObjectTypeEnum",
  values: {
    ARTIST: { description: "Artist" },
    ARTWORK: { description: "Artwork" },
    SHOW: { description: "Show" },
    VIEWING_ROOM: { description: "ViewingRoom" },
  },
})

const rankedEntityType = (name: string) =>
  new GraphQLObjectType<any, ResolverContext>({
    name,
    fields: snakeCaseFields({
      entityId: { type: new GraphQLNonNull(GraphQLString) },
    }),
  })

const AnalyticsArtistType = rankedEntityType("AnalyticsArtist")
const AnalyticsArtworkType = rankedEntityType("AnalyticsArtwork")
const AnalyticsShowType = rankedEntityType("AnalyticsShow")
const AnalyticsViewingRoomType = rankedEntityType("AnalyticsViewingRoom")

// Vortex's raw `object_type` values, and the local root field (and type) each
// ranked entity is loaded with.
const RANKED_ENTITIES = {
  artist: {
    type: AnalyticsArtistType,
    rootField: "artist",
    typename: "Artist",
  },
  artwork: {
    type: AnalyticsArtworkType,
    rootField: "artwork",
    typename: "Artwork",
  },
  show: { type: AnalyticsShowType, rootField: "show", typename: "Show" },
  "viewing-room": {
    type: AnalyticsViewingRoomType,
    rootField: "viewingRoom",
    typename: "ViewingRoom",
  },
}

const RankedStatsUnionType = new GraphQLUnionType({
  name: "AnalyticsRankedStatsUnion",
  description: "An artwork, artist, show, or viewing room",
  types: [
    AnalyticsArtistType,
    AnalyticsArtworkType,
    AnalyticsShowType,
    AnalyticsViewingRoomType,
  ],
  resolveType: ({ type }) => RANKED_ENTITIES[type]?.type.name,
})

const RankedEntityUnionType = new GraphQLUnionType({
  name: "AnalyticsRankedEntityUnion",
  types: () => [
    require("schema/v2/artist").ArtistType,
    require("schema/v2/artwork").ArtworkType,
    require("schema/v2/show").ShowType,
    require("schema/v2/viewingRoom").ViewingRoomType,
  ],
  resolveType: ({ __typename }) => __typename,
})

const RankedStatsType = new GraphQLObjectType<any, ResolverContext>({
  name: "AnalyticsRankedStats",
  description: "Top artworks, shows, viewing rooms, or artists from a partner",
  fields: {
    entity: {
      type: RankedEntityUnionType,
      // Loads the entity through the local root field, as stitching delegated
      // to it, so e.g. a missing show behaves the same.
      resolve: async ({ object_id, object_type }, _args, context, info) => {
        const entity = RANKED_ENTITIES[object_type]
        if (!entity) return null

        const field = info.schema.getQueryType()!.getFields()[entity.rootField]
        const args = Object.fromEntries(
          field.args
            .filter(({ defaultValue }) => defaultValue !== undefined)
            .map(({ name, defaultValue }) => [name, defaultValue])
        )
        const response = await field.resolve!(
          undefined,
          { ...args, id: object_id },
          context,
          info
        )
        // Root fields like `show` return (not throw) an HTTPError for a hidden
        // entity; pass it on so the field errors, as it did when stitched.
        if (!response || response instanceof Error) return response

        return { ...response, __typename: entity.typename }
      },
    },
    period: periodField,
    rankedEntity: {
      type: new GraphQLNonNull(RankedStatsUnionType),
      resolve: ({ object_id, object_type }) => ({
        entity_id: object_id,
        type: object_type,
      }),
    },
    value: { type: new GraphQLNonNull(GraphQLInt) },
  },
})

const RankedStatsConnectionType = analyticsConnectionType({
  connectionName: "AnalyticsRankedStatsConnection",
  edgeName: "AnalyticsRankedStatsEdge",
  nodeName: "RankedStats",
  nodeType: RankedStatsType,
  pageCursors: false,
})

// Vortex's `max_page_size: 20` for rankedStats.
const RANKED_STATS_MAX_PAGE_SIZE = 20

const capPageSize = ({ first, last, ...args }) => {
  const cap = (size) =>
    size == null ? size : Math.min(size, RANKED_STATS_MAX_PAGE_SIZE)
  return first == null && last == null
    ? { ...args, first: RANKED_STATS_MAX_PAGE_SIZE }
    : { ...args, first: cap(first), last: cap(last) }
}

// Grouped stats

const GroupedStatsMetricEnum = new GraphQLEnumType({
  name: "AnalyticsGroupedStatsMetricEnum",
  values: {
    VISITOR_BY_DEVICE: { description: "visitor_by_device" },
    VISITOR_BY_LANDING_PAGE: { description: "visitor_by_landing_page" },
    VISITOR_BY_LOCATION: { description: "visitor_by_location" },
    VISITOR_BY_REFERRAL: { description: "visitor_by_referral" },
  },
})

const GroupedStatsObjectTypeEnum = new GraphQLEnumType({
  name: "AnalyticsGroupedStatsObjectTypeEnum",
  values: {
    COUNTRY: { description: "country" },
    DEVICE: { description: "device type" },
    LANDING_PAGE: { description: "landing page" },
    REFERRAL: { description: "referral" },
  },
})

const groupedEntityType = (name: string) =>
  new GraphQLObjectType<any, ResolverContext>({
    name,
    fields: snakeCaseFields({
      metric: { type: new GraphQLNonNull(GraphQLString) },
      name: { type: new GraphQLNonNull(GraphQLString) },
      percent: { type: new GraphQLNonNull(GraphQLFloat) },
      type: { type: new GraphQLNonNull(GraphQLString) },
      value: { type: new GraphQLNonNull(GraphQLInt) },
    }),
  })

// Keyed by Vortex's raw `type` values.
const GROUPED_ENTITY_TYPES = {
  Country: groupedEntityType("AnalyticsVisitorsByCountry"),
  Device: groupedEntityType("AnalyticsVisitorsByDevice"),
  LandingPage: groupedEntityType("AnalyticsVisitorsByLandingPage"),
  Referral: groupedEntityType("AnalyticsVisitorsByReferral"),
}

const GroupedStatsUnionType = new GraphQLUnionType({
  name: "AnalyticsGroupedStatsUnion",
  description: "A grouped stat item: country or device etc.",
  types: Object.values(GROUPED_ENTITY_TYPES),
  resolveType: ({ type }) => GROUPED_ENTITY_TYPES[type]?.name,
})

const GroupedStatsType = new GraphQLObjectType<any, ResolverContext>({
  name: "AnalyticsGroupedStats",
  description: "Visitor countries, device, referals and session page",
  fields: {
    groupedEntity: {
      type: new GraphQLNonNull(GroupedStatsUnionType),
      resolve: (row) => row,
    },
    period: periodField,
  },
})

const GroupedStatsConnectionType = analyticsConnectionType({
  connectionName: "AnalyticsGroupedStatsConnection",
  edgeName: "AnalyticsGroupedStatsEdge",
  nodeName: "GroupedStats",
  nodeType: GroupedStatsType,
  pageCursors: false,
})

// Partner stats

// Partner stats fields backed by a REST section, named as the field in
// snake_case, e.g. artworkPublished is `partner_stats/artwork_published`.
const SECTION_FIELDS = new Set([
  "artworkPublished",
  "artworksPublished",
  "audience",
  "groupedStats",
  "inquiry",
  "pageview",
  "pageviews",
  "rankedStats",
  "sales",
])

const partnerStatsKey = (
  partnerId: string,
  fieldName: string,
  args: Record<string, any>
): PartnerStatsKey => ({
  partnerId,
  period: periodName(args.period),
  section: snakeCase(fieldName) as PartnerStatsSection,
  ...pick(args, ["objectType", "metric"]),
})

const loadSection = (
  { partnerId },
  args: Record<string, any>,
  context: ResolverContext,
  info: GraphQLResolveInfo
) =>
  vortexStatsLoader(
    context,
    "vortexPartnerStatsLoader"
  )(partnerStatsKey(partnerId, info.fieldName, args))

const sectionField = (
  type: GraphQLOutputType,
  description: string,
  deprecationReason?: string
): GraphQLFieldConfig<any, ResolverContext> => ({
  type,
  description,
  deprecationReason,
  args: periodArgs,
  resolve: async (source, args, context, info) => {
    const stats = await loadSection(source, args, context, info)
    return (
      stats && { ...stats, partner_id: source.partnerId, period: args.period }
    )
  },
})

const PartnerStatsType = new GraphQLObjectType<any, ResolverContext>({
  name: "AnalyticsPartnerStats",
  description: "Partner Stats",
  fields: {
    artworkPublished: sectionField(
      PartnerStatsArtworksPublishedType,
      "Time series data on number of artworks published"
    ),
    artworksPublished: sectionField(
      ArtworksPublishedStatsType,
      "Time series data on number of artworks published",
      "Use artworkPublished for refactored time series bucket code"
    ),
    audience: sectionField(PartnerAudienceStatsType, "Audience stats"),
    groupedStats: {
      type: GroupedStatsConnectionType,
      description: "Visitor countries, device, referals and session page",
      args: {
        ...analyticsConnectionArgs,
        metric: { type: new GraphQLNonNull(GroupedStatsMetricEnum) },
        objectType: { type: new GraphQLNonNull(GroupedStatsObjectTypeEnum) },
        ...periodArgs,
      },
      resolve: async (source, args, context, info) => {
        const { period, metric, objectType, ...connectionArgs } = args
        const rows = (await loadSection(source, args, context, info)) ?? []
        return connectionFromArray(
          rows.map((row) => ({ ...row, period })),
          connectionArgs
        )
      },
    },
    inquiry: sectionField(PartnerInquiryStatsType, "Inquiry stats"),
    pageview: sectionField(
      PartnerStatsPageviewsType,
      "Different types of partner pageviews"
    ),
    pageviews: sectionField(
      PageviewStatsType,
      "Different types of partner pageviews",
      "Use pageview for refactored time series bucket code"
    ),
    partnerId: partnerIdField,
    rankedStats: {
      type: RankedStatsConnectionType,
      description:
        "Artworks, shows, viewing rooms, or artists ranked by views. Capped at 20 by the underlying sql query.",
      args: {
        ...analyticsConnectionArgs,
        objectType: { type: new GraphQLNonNull(RankedStatsObjectTypeEnum) },
        ...periodArgs,
      },
      resolve: async (source, args, context, info) => {
        const { period, objectType, ...connectionArgs } = args
        const rows = (await loadSection(source, args, context, info)) ?? []
        return connectionFromArray(
          rows.map((row) => ({ ...row, period })),
          capPageSize(connectionArgs)
        )
      },
    },
    sales: sectionField(PartnerSalesStatsType, "Sales stats"),
    // Vortex never resolved these deprecated fields to anything.
    topArtworks: {
      type: RankedStatsConnectionType,
      description: "Top artworks ranked by views",
      deprecationReason: "Use rankedStats(objectType: ) instead",
      args: analyticsConnectionArgs,
      resolve: () => null,
    },
    uniqueVisitors: {
      type: GraphQLInt,
      description: "Number of unique visitors",
      deprecationReason: "Use audience() { uniqueVisitors } instead",
      args: periodArgs,
      resolve: () => null,
    },
  },
})

// Every REST request the selected partner stats fields will make.
const selectedSectionKeys = (
  partnerId: string,
  info: GraphQLResolveInfo
): PartnerStatsKey[] => {
  const { fields } = simplifyParsedResolveInfoFragmentWithType(
    parseResolveInfo(info) as ResolveTree,
    PartnerStatsType
  )
  return Object.values(fields as Record<string, ResolveTree>)
    .filter(({ name }) => SECTION_FIELDS.has(name))
    .map(({ name, args }) => partnerStatsKey(partnerId, name, args))
}

const isAuthorizationError = (error) => [401, 403].includes(error?.statusCode)

export const PartnerAnalyticsField: GraphQLFieldConfig<any, ResolverContext> = {
  type: PartnerStatsType,
  // Vortex authorized the whole `partnerStats` field, so a rejected token
  // fails `analytics` as it did: the selected sections are loaded up front
  // (DataLoader batches each section's periods either way) and an
  // authorization error fails the field. Other errors stay on their section.
  resolve: async ({ _id: partnerId }, _args, context, info) => {
    const partnerStatsLoader = vortexStatsLoader(
      context,
      "vortexPartnerStatsLoader"
    )
    const keys = selectedSectionKeys(partnerId, info)

    const results = await Promise.allSettled(keys.map(partnerStatsLoader))
    const rejected = results.find(
      (result): result is PromiseRejectedResult =>
        result.status === "rejected" && isAuthorizationError(result.reason)
    )
    if (rejected) throw rejected.reason

    return { partnerId }
  },
}

// User stats

const UserStatsType = new GraphQLObjectType<any, ResolverContext>({
  name: "AnalyticsUserStats",
  description: "Statistics for users",
  fields: snakeCaseFields({
    totalPurchaseCount: { type: new GraphQLNonNull(GraphQLInt) },
    userId: { type: new GraphQLNonNull(GraphQLString) },
  }),
})

export const UserAnalyticsField: GraphQLFieldConfig<any, ResolverContext> = {
  type: UserStatsType,
  resolve: async ({ id }, _args, context) => {
    const { data } = await vortexStatsLoader(
      context,
      "vortexUserStatsLoader"
    )({
      user_id: id,
    })
    return data
  },
}
