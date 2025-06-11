import { map, orderBy } from "lodash"
import AggregationCount from "./aggregation_count"
import { GraphQLObjectType, GraphQLEnumType, GraphQLList } from "graphql"
import { ResolverContext } from "types/graphql"

export const ArtworksAggregation = new GraphQLEnumType({
  name: "ArtworkAggregation",
  values: {
    ARTIST: {
      value: "artist",
    },
    ARTIST_NATIONALITY: {
      value: "artist_nationality",
    },
    ARTIST_SERIES: {
      value: "artist_series",
    },
    ATTRIBUTION_CLASS: {
      value: "attribution_class",
    },
    COLOR: {
      value: "color",
    },
    DIMENSION_RANGE: {
      value: "dimension_range",
    },
    FOLLOWED_ARTISTS: {
      value: "followed_artists",
    },
    IMPORT_SOURCE: {
      value: "import_source",
    },
    MAJOR_PERIOD: {
      value: "major_period",
    },
    MATERIALS_TERMS: {
      value: "materials_terms",
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
    LOCATION_CITY: {
      value: "location_city",
    },
    PARTNER: {
      value: "partner",
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
    SIMPLE_PRICE_HISTOGRAM: {
      value: "simple_price_histogram",
    },
    TOTAL: {
      value: "total",
    },
  },
})

const sorts = {
  default: (counts) => orderBy(counts, ["count"], ["desc"]),
  period: (counts) => orderBy(counts, ["name"], ["desc"]),
  major_period: (counts) => orderBy(counts, ["name"], ["desc"]),
  gallery: (counts) => orderBy(counts, ["count", "name"], ["desc", "asc"]),
  institution: (counts) => orderBy(counts, ["count", "name"], ["desc", "asc"]),
}

export const ArtworksAggregationResultsType = new GraphQLObjectType<
  any,
  ResolverContext
>({
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
