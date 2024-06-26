import AggregationCount from "./aggregation_count"
import { map } from "lodash"
import { GraphQLObjectType, GraphQLEnumType, GraphQLList } from "graphql"
import { ResolverContext } from "types/graphql"

export const AuctionResultsAggregation = new GraphQLEnumType({
  name: "AuctionResultsAggregation",
  values: {
    SIMPLE_PRICE_HISTOGRAM: {
      value: "simple_price_histogram",
    },
    CURRENCIES_COUNT: {
      value: "currencies_count",
    },
    LOTS_BY_SALE_YEAR: {
      value: "lots_by_sale_year",
    },
    LOTS_BY_CREATED_YEAR: {
      value: "lots_by_created_year",
    },
  },
})

export const AuctionResultsAggregationType = new GraphQLObjectType<
  any,
  ResolverContext
>({
  name: "AuctionResultsAggregationType",
  description: "The results for one of the requested aggregations",
  fields: () => ({
    counts: {
      type: new GraphQLList(AggregationCount.type),
      resolve: ({ counts }) => map(counts, AggregationCount.resolve),
    },
    slice: {
      type: AuctionResultsAggregation,
    },
  }),
})
