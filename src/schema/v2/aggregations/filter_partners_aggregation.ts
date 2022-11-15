import { map, omit } from "lodash"
import Partner from "schema/v2/partner/partner"
import AggregationCount from "./aggregation_count"
import {
  GraphQLObjectType,
  GraphQLEnumType,
  GraphQLList,
  GraphQLInt,
} from "graphql"
import { ResolverContext } from "types/graphql"

export const PartnersAggregation = new GraphQLEnumType({
  name: "PartnersAggregation",
  values: {
    CATEGORY: {
      value: "partner_category",
    },
    LOCATION: {
      value: "",
    },
    TOTAL: {
      value: "total",
    },
  },
})

export const PartnersAggregationResultsType = new GraphQLObjectType<
  any,
  ResolverContext
>({
  name: "PartnersAggregationResults",
  description: "The results for one of the requested aggregations",
  fields: () => ({
    counts: {
      type: new GraphQLList(AggregationCount.type),
      resolve: ({ counts }) => map(counts, AggregationCount.resolve),
    },
    slice: {
      type: PartnersAggregation,
    },
  }),
})

export const FilterPartnersType = new GraphQLObjectType<any, ResolverContext>({
  name: "FilterPartners",
  fields: () => ({
    aggregations: {
      type: new GraphQLList(PartnersAggregationResultsType),
      resolve: ({ aggregations }) =>
        map(omit(aggregations, ["total"]), (counts, slice) => ({
          slice,
          counts,
        })),
    },
    hits: {
      type: new GraphQLList(Partner.type),
    },
    total: {
      type: GraphQLInt,
      resolve: ({ aggregations }) => aggregations.total.value,
    },
  }),
})
