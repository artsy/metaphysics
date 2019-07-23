import { map } from "lodash"
import AggregationCount from "schema/v1/aggregations/aggregation_count"
import { GraphQLObjectType, GraphQLEnumType, GraphQLList } from "graphql"
import { ResolverContext } from "types/graphql"

export const SearchAggregation = new GraphQLEnumType({
  name: "SearchAggregation",
  values: {
    TYPE: {
      value: "_type",
    },
  },
})

export const SearchAggregationResultsType = new GraphQLObjectType<
  any,
  ResolverContext
>({
  name: "SearchAggregationResults",
  description: "The results for a requested aggregations",
  fields: () => ({
    counts: {
      type: new GraphQLList(AggregationCount.type),
      resolve: ({ counts }) => map(counts, AggregationCount.resolve),
    },
    slice: {
      type: SearchAggregation,
    },
  }),
})
