import { map, omit } from 'lodash';
import Artwork from '../artwork';
import AggregationCount from './aggregation_count';
import {
  GraphQLObjectType,
  GraphQLEnumType,
  GraphQLList,
  GraphQLInt,
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
    MEDIUM: {
      value: 'medium',
    },
    FOR_SALE: {
      value: 'for_sale',
    },
    GALLERY: {
      value: 'partner_id',
    },
    INSTITUTION: {
      value: 'partner_id',
    },
    RELATED_GENE: {
      value: 'gene_id',
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

export const FilterArtworksType = new GraphQLObjectType({
  name: 'FilterArtworks',
  fields: () => ({
    hits: {
      type: new GraphQLList(Artwork.type),
    },
    total: {
      type: GraphQLInt,
      resolve: ({ aggregations }) => aggregations.total.value,
    },
    aggregations: {
      type: new GraphQLList(ArtworksAggregationResultsType),
      resolve: ({ aggregations }) =>
        map(omit(aggregations, ['total']), (counts, slice) => ({ slice, counts })),
    },
  }),
});
