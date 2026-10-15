import {
  GraphQLEnumType,
  GraphQLEnumValueConfigMap,
  GraphQLFieldConfig,
  GraphQLFieldConfigMap,
  GraphQLFloat,
  GraphQLID,
  GraphQLInt,
  GraphQLList,
  GraphQLNonNull,
  GraphQLObjectType,
  GraphQLString,
} from "graphql"
import { snakeCase } from "lodash"
import { ResolverContext } from "types/graphql"
import {
  AnalyticsDateTimeType,
  analyticsConnectionArgs,
  analyticsConnectionFromArray,
  analyticsConnectionType,
  BigIntType,
  ISO8601DateTimeType,
} from "./shared"

/**
 * Price insights served from Vortex's REST API. These replace the root fields
 * the stitched Vortex schema exposed, with the same names and types; they are
 * only mounted when `USE_UNSTITCHED_VORTEX` is on.
 *
 * Vortex responds in snake_case with raw values, so each field reads its
 * snake_case key.
 */

const snakeCaseFields = (
  fields: Record<string, GraphQLFieldConfig<any, ResolverContext>>
): GraphQLFieldConfigMap<any, ResolverContext> =>
  Object.fromEntries(
    Object.entries(fields).map(([name, config]) => {
      const key = snakeCase(name)
      return [name, { resolve: (source) => source[key], ...config }]
    })
  )

const MARKET_PRICE_INSIGHT_FIELDS = {
  annualLotsSold: GraphQLInt,
  annualValueSoldCents: BigIntType,
  artistId: GraphQLID,
  artistName: GraphQLString,
  artsyQInventory: GraphQLInt,
  createdAt: ISO8601DateTimeType,
  demandRank: GraphQLFloat,
  demandTrend: GraphQLFloat,
  highRangeCents: BigIntType,
  id: new GraphQLNonNull(GraphQLID),
  largeHighRangeCents: BigIntType,
  largeLowRangeCents: BigIntType,
  largeMidRangeCents: BigIntType,
  lastAuctionResultDate: ISO8601DateTimeType,
  liquidityRank: GraphQLFloat,
  lotsSoldLast12Months: GraphQLInt,
  lotsSoldLast24Months: GraphQLInt,
  lotsSoldLast36Months: GraphQLInt,
  lotsSoldLast48Months: GraphQLInt,
  lotsSoldLast60Months: GraphQLInt,
  lotsSoldLast72Months: GraphQLInt,
  lotsSoldLast84Months: GraphQLInt,
  lotsSoldLast96Months: GraphQLInt,
  lowRangeCents: BigIntType,
  medianSaleOverEstimatePercentage: GraphQLInt,
  medianSalePriceLast36Months: BigIntType,
  medianSalePriceLast96Months: BigIntType,
  medianSaleToEstimateRatio: GraphQLFloat,
  medium: GraphQLString,
  mediumHighRangeCents: BigIntType,
  mediumLowRangeCents: BigIntType,
  mediumMidRangeCents: BigIntType,
  midRangeCents: BigIntType,
  sellThroughRate: GraphQLFloat,
  smallHighRangeCents: BigIntType,
  smallLowRangeCents: BigIntType,
  smallMidRangeCents: BigIntType,
  updatedAt: ISO8601DateTimeType,
}

export const MarketPriceInsightsType = new GraphQLObjectType<
  any,
  ResolverContext
>({
  name: "MarketPriceInsights",
  description: "Market Price Insights",
  fields: snakeCaseFields(
    Object.fromEntries(
      Object.entries(MARKET_PRICE_INSIGHT_FIELDS).map(([name, type]) => [
        name,
        { type },
      ])
    )
  ),
})

// Vortex sorts by any price_insights column. `medianSaleOverEstimatePercentage`
// is computed, so it isn't sortable.
const SORTABLE_COLUMNS = Object.keys(MARKET_PRICE_INSIGHT_FIELDS)
  .filter((name) => name !== "medianSaleOverEstimatePercentage")
  .map(snakeCase)

const PriceInsightSortType = new GraphQLEnumType({
  name: "PriceInsightSort",
  values: SORTABLE_COLUMNS.sort().reduce<GraphQLEnumValueConfigMap>(
    (values, column) => ({
      ...values,
      [`${column.toUpperCase()}_ASC`]: {
        description: `sort by ${column} in ascending order`,
      },
      [`${column.toUpperCase()}_DESC`]: {
        description: `sort by ${column} in descending order`,
      },
    }),
    {}
  ),
})

const PriceInsightConnectionType = analyticsConnectionType({
  connectionName: "PriceInsightConnection",
  edgeName: "PriceInsightEdge",
  nodeName: "MarketPriceInsights",
  nodeType: MarketPriceInsightsType,
})

const CalendarYearMarketPriceInsightsType = new GraphQLObjectType<
  any,
  ResolverContext
>({
  name: "CalendarYearMarketPriceInsights",
  description: "Market Price Insights Calendar year",
  fields: snakeCaseFields({
    artistId: { type: GraphQLID },
    artistName: { type: GraphQLString },
    averageSalePrice: { type: BigIntType },
    createdAt: { type: ISO8601DateTimeType },
    id: { type: new GraphQLNonNull(GraphQLID) },
    lotsSold: { type: BigIntType },
    medianSalePrice: { type: BigIntType },
    medium: { type: GraphQLString },
    updatedAt: { type: ISO8601DateTimeType },
    valueSold: { type: BigIntType },
    year: { type: new GraphQLNonNull(GraphQLString) },
  }),
})

const CalendarYearPriceInsightsType = new GraphQLObjectType<
  any,
  ResolverContext
>({
  name: "CalendarYearPriceInsights",
  description: "Price Insights Calendar year",
  fields: snakeCaseFields({
    calendarYearMarketPriceInsights: {
      type: new GraphQLList(
        new GraphQLNonNull(CalendarYearMarketPriceInsightsType)
      ),
    },
    medium: { type: new GraphQLNonNull(GraphQLString) },
  }),
})

const AnalyticsArtistSparklineType = new GraphQLObjectType<
  any,
  ResolverContext
>({
  name: "AnalyticsArtistSparkline",
  description: "Artist Sparkline",
  fields: snakeCaseFields({
    artistId: { type: new GraphQLNonNull(GraphQLID) },
    artistName: { type: GraphQLString },
    eventDigest: { type: GraphQLString },
    sparkles: { type: BigIntType },
    tier: { type: GraphQLFloat },
    year: { type: GraphQLString },
  }),
})

const AnalyticsArtistSparklineConnectionType = analyticsConnectionType({
  connectionName: "AnalyticsArtistSparklineConnection",
  edgeName: "AnalyticsArtistSparklineEdge",
  nodeName: "ArtistSparkline",
  nodeType: AnalyticsArtistSparklineType,
})

// Vortex rejects a blank year, where its GraphQL API ignored one.
const yearFilters = ({ startYear, endYear }) => ({
  ...(startYear ? { start_year: startYear } : {}),
  ...(endYear ? { end_year: endYear } : {}),
})

const MarketPriceInsights: GraphQLFieldConfig<any, ResolverContext> = {
  type: MarketPriceInsightsType,
  description: "Get price insights for a market.",
  args: {
    artistId: { type: new GraphQLNonNull(GraphQLID) },
    medium: { type: new GraphQLNonNull(GraphQLString) },
  },
  resolve: async (_root, { artistId, medium }, { unauthenticatedLoaders }) => {
    const { data } = await unauthenticatedLoaders.marketPriceInsightsLoader({
      artist_id: artistId,
      medium,
    })
    return data
  },
}

const PriceInsights: GraphQLFieldConfig<any, ResolverContext> = {
  type: PriceInsightConnectionType,
  description: "Get all price insights for an artist.",
  args: {
    ...analyticsConnectionArgs,
    artistId: { type: new GraphQLNonNull(GraphQLID) },
    sort: {
      type: PriceInsightSortType,
      description: "Return price insights sorted this way",
    },
  },
  resolve: async (
    _root,
    { artistId, sort, ...connectionArgs },
    { unauthenticatedLoaders }
  ) => {
    const { data } = await unauthenticatedLoaders.priceInsightsLoader({
      artist_id: artistId,
      ...(sort ? { sort } : {}),
    })
    return analyticsConnectionFromArray(data ?? [], connectionArgs)
  },
}

const CalendarYearMarketPriceInsights: GraphQLFieldConfig<
  any,
  ResolverContext
> = {
  type: new GraphQLList(
    new GraphQLNonNull(CalendarYearMarketPriceInsightsType)
  ),
  description:
    "Get price insights for a market for each calendar year sorted by year asc.",
  args: {
    artistId: { type: new GraphQLNonNull(GraphQLID) },
    endYear: { type: GraphQLString },
    medium: { type: new GraphQLNonNull(GraphQLString) },
    startYear: { type: GraphQLString },
  },
  resolve: async (
    _root,
    { artistId, medium, ...years },
    { unauthenticatedLoaders }
  ) => {
    const {
      data,
    } = await unauthenticatedLoaders.calendarYearMarketPriceInsightsLoader({
      artist_id: artistId,
      medium,
      ...yearFilters(years),
    })
    return data
  },
}

const CalendarYearPriceInsights: GraphQLFieldConfig<any, ResolverContext> = {
  type: new GraphQLList(new GraphQLNonNull(CalendarYearPriceInsightsType)),
  description:
    "Get list of calendar year price insights for an artist for each market sorted by year asc.",
  args: {
    artistId: { type: new GraphQLNonNull(GraphQLID) },
    endYear: { type: GraphQLString },
    startYear: { type: GraphQLString },
  },
  resolve: async (
    _root,
    { artistId, ...years },
    { unauthenticatedLoaders }
  ) => {
    const {
      data,
    } = await unauthenticatedLoaders.calendarYearPriceInsightsLoader({
      artist_id: artistId,
      ...yearFilters(years),
    })
    return data
  },
}

const ArtistSparklines: GraphQLFieldConfig<any, ResolverContext> = {
  type: AnalyticsArtistSparklineConnectionType,
  description: "Get the year sparklines for the current artist.",
  args: {
    ...analyticsConnectionArgs,
    artistId: { type: new GraphQLNonNull(GraphQLString) },
  },
  resolve: async (
    _root,
    { artistId, ...connectionArgs },
    { unauthenticatedLoaders }
  ) => {
    const { data } = await unauthenticatedLoaders.artistSparklinesLoader({
      artist_id: artistId,
    })
    return analyticsConnectionFromArray(data ?? [], connectionArgs)
  },
}

const LastUpdatedAt: GraphQLFieldConfig<any, ResolverContext> = {
  type: AnalyticsDateTimeType,
  description: "Last updated timestamp",
  resolve: async (_root, _args, { unauthenticatedLoaders }) => {
    const { data } = await unauthenticatedLoaders.warehouseMetadataLoader()
    return data?.last_updated_at
  },
}

export const priceInsightsRootFields = {
  analyticsArtistSparklines: ArtistSparklines,
  analyticsCalendarYearMarketPriceInsights: CalendarYearMarketPriceInsights,
  analyticsCalendarYearPriceInsights: CalendarYearPriceInsights,
  analyticsLastUpdatedAt: LastUpdatedAt,
  marketPriceInsights: MarketPriceInsights,
  priceInsights: PriceInsights,
}
