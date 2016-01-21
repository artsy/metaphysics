import _ from 'lodash';
import Partners from './partners';
import Partner from './partner';
import {
  GraphQLObjectType,
  GraphQLList,
  GraphQLNonNull,
  GraphQLEnumType,
} from 'graphql';

const PartnersAggregation = new GraphQLEnumType({
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

const FilterPartnersType = new GraphQLObjectType({
  name: 'FilterPartners',
  fields: () => ({
    hits: {
      type: new GraphQLList(Partner.type),
    },
    aggregations: {
    },
  }),
});

const FilterPartners = {
  type: FilterPartnersType,
  description: 'Partners Elastic Search results',
  args: _.create(Partners.args, {
    aggregations: new GraphQLNonNull(new GraphQLList(PartnersAggregation)),
  }),
};

export default FilterPartners;
