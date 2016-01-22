import Partner from '../partner';
import { parseCounts, AggregationCountType } from './aggregation_count_type';
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
      type: new GraphQLList(AggregationCountType),
      resolve: (obj) => parseCounts(obj),
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
      resolve: (obj) =>
        Object.keys(obj.aggregations).map(function (key) {
          const aggregation = {};
          aggregation.counts = obj.aggregations[key];
          aggregation.slice = key;
          return aggregation;
        }),
    },
  }),
});
