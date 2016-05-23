import { map } from 'lodash';
import AggregationCount from './aggregation_count';
import {
  GraphQLObjectType,
  GraphQLEnumType,
  GraphQLList,
} from 'graphql';

export const ArtworksAggregation = new GraphQLEnumType({
  name: 'ArtworkAggregation',
  values: {
    PRICE_RANGE: {
      value: 'price_range',
    },
    DIMENSION_RANGE: {
      value: 'dimension_range',
    },
    COLOR: {
      value: 'color',
    },
    PERIOD: {
      value: 'period',
    },
    MAJOR_PERIOD: {
      value: 'major_period',
    },
    PARTNER_CITY: {
      value: 'partner_city',
    },
    MEDIUM: {
      value: 'medium',
    },
    GALLERY: {
      value: 'gallery',
    },
    INSTITUTION: {
      value: 'institution',
    },
    TOTAL: {
      value: 'total',
    },
  },
});

export const ArtworksAggregationResultsType = new GraphQLObjectType({
  name: 'ArtworksAggregationResults',
  description: 'The results for one of the requested aggregations',
  fields: () => ({
    slice: {
      type: ArtworksAggregation,
    },
    counts: {
      type: new GraphQLList(AggregationCount.type),
      resolve: ({ counts }) => map(counts, AggregationCount.resolve),
    },
  }),
});
