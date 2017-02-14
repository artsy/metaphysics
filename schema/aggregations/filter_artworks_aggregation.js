// @flow

import { map, orderBy } from 'lodash';
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
    ARTIST: {
      value: 'artist',
    },
    FOLLOWED_ARTISTS: {
      value: 'followed_artists',
    },
    MERCHANDISABLE_ARTISTS: {
      value: 'merchandisable_artists',
    },
  },
});

const sorts = {
  default: (counts) => orderBy(counts, ['count'], ['desc']),
  period: (counts) => orderBy(counts, ['name'], ['desc']),
  major_period: (counts) => orderBy(counts, ['name'], ['desc']),
  gallery: (counts) => orderBy(counts, ['count', 'name'], ['desc', 'asc']),
  institution: (counts) => orderBy(counts, ['count', 'name'], ['desc', 'asc']),
};

export const ArtworksAggregationResultsType = new GraphQLObjectType({
  name: 'ArtworksAggregationResults',
  description: 'The results for one of the requested aggregations',
  fields: () => ({
    slice: {
      type: ArtworksAggregation,
    },
    counts: {
      type: new GraphQLList(AggregationCount.type),
      resolve: ({ counts, slice }) => {
        const mapped = map(counts, AggregationCount.resolve);
        let sort = sorts[slice];
        if (!sort) sort = sorts.default;
        return sort ? sort(mapped) : mapped;
      },
    },
  }),
});
