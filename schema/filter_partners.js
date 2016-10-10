/* @flow */

import _ from 'lodash';
import {
  GraphQLList,
  GraphQLNonNull,
} from 'graphql';

import gravity from '../lib/loaders/gravity';
import Partners from './partners';
import {
  FilterPartnersType,
  PartnersAggregation,
} from './aggregations/filter_partners_aggregation';

const FilterPartners = {
  type: FilterPartnersType,
  description: 'Partners Elastic Search results',
  args: _.assign({}, Partners.args, {
    aggregations: {
      type: new GraphQLNonNull(new GraphQLList(PartnersAggregation)),
    },
  }),
  resolve: (root, options) => gravity('partners', options),
};

export default FilterPartners;
