// @ts-check

import { map, orderBy } from "lodash"
import AggregationCount from "./aggregation_count"
import { GraphQLObjectType, GraphQLEnumType, GraphQLList } from "graphql"

export const SaleArtworksAggregation = new GraphQLEnumType({
  name: "SaleArtworkAggregation",
  values: {
    ARTIST: {
      value: "artist",
    },
    FOLLOWED_ARTISTS: {
      value: "followed_artists",
    },
    MEDIUM: {
      value: "medium",
    },
    TOTAL: {
      value: "total",
    },
  },
})

const sorts = {
  default: counts => orderBy(counts, ["count"], ["desc"]),
  artist: counts => orderBy(counts, ["sortable_id", "count"], ["asc", "desc"]),
}

export const SaleArtworksAggregationResultsType = new GraphQLObjectType({
  name: "SaleArtworksAggregationResults",
  description: "The results for one of the requested aggregations",
  fields: () => ({
    counts: {
      type: new GraphQLList(AggregationCount.type),
      resolve: ({ counts, slice }) => {
        const mapped = map(counts, AggregationCount.resolve)
        let sort = sorts[slice]
        if (!sort) sort = sorts.default
        return sort ? sort(mapped) : mapped
      },
    },
    slice: {
      type: SaleArtworksAggregation,
    },
  }),
})
