// @ts-check

import { map, orderBy } from "lodash"
import AggregationCount from "./aggregation_count"
import { GraphQLObjectType, GraphQLEnumType, GraphQLList } from "graphql"

export const ArtworksAggregation = new GraphQLEnumType({
  name: "ArtworkAggregation",
  values: {
    COLOR: {
      value: "color",
    },
    DIMENSION_RANGE: {
      value: "dimension_range",
    },
    FOLLOWED_ARTISTS: {
      value: "followed_artists",
    },
    MAJOR_PERIOD: {
      value: "major_period",
    },
    MEDIUM: {
      value: "medium",
    },
    MERCHANDISABLE_ARTISTS: {
      value: "merchandisable_artists",
    },
    GALLERY: {
      value: "gallery",
    },
    INSTITUTION: {
      value: "institution",
    },
    PARTNER_CITY: {
      value: "partner_city",
    },
    PERIOD: {
      value: "period",
    },
    PRICE_RANGE: {
      value: "price_range",
    },
    TOTAL: {
      value: "total",
    },
  },
})

const sorts = {
  default: counts => orderBy(counts, ["count"], ["desc"]),
  period: counts => orderBy(counts, ["name"], ["desc"]),
  major_period: counts => orderBy(counts, ["name"], ["desc"]),
  gallery: counts => orderBy(counts, ["count", "name"], ["desc", "asc"]),
  institution: counts => orderBy(counts, ["count", "name"], ["desc", "asc"]),
}

export const ArtworksAggregationResultsType = new GraphQLObjectType({
  name: "ArtworksAggregationResults",
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
      type: ArtworksAggregation,
    },
  }),
})
