import gravity from '../lib/loaders/gravity';
import PartnerCategory from './partner_category';
import {
  GraphQLList,
  GraphQLInt,
} from 'graphql';

const PartnerCategories = {
  type: new GraphQLList(PartnerCategory.type),
  description: 'A list of PartnerCategories',
  args: {
    size: {
      type: GraphQLInt,
    },
  },
  resolve: (root, options) => gravity('partner_categories', options),
};

export default PartnerCategories;
