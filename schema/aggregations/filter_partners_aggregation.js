import { map } from 'lodash';
import Partner from '../partner';
import AggregationCount from './aggregation_count';
import {
  GraphQLObjectType,
  GraphQLEnumType,
  GraphQLList,
} from 'graphql';

export const PartnersAggregation = new GraphQLEnumType({
  name: 'PartnersAggregation',
  values: {
    LOCATION: {
      value: '',
    },
    CATEGORY: {
      value: 'partner_category',
    },
  },
});

export const PartnersAggregationResultsType = new GraphQLObjectType({
  name: 'PartnersAggregationResults',
  description: 'The results for one of the requested aggregations',
  fields: () => ({
    slice: {
      type: PartnersAggregation,
    },
    counts: {
      type: new GraphQLList(AggregationCount.type),
      resolve: ({ counts }) => map(counts, AggregationCount.resolve),
    },
  }),
});

export const FilterPartnersType = new GraphQLObjectType({
  name: 'FilterPartners',
  fields: () => ({
    hits: {
      type: new GraphQLList(Partner.type),
    },
    aggregations: {
      type: new GraphQLList(PartnersAggregationResultsType),
      resolve: ({ aggregations }) =>
        map(aggregations, (counts, slice) => ({ slice, counts })),
    },
  }),
});
