import gravity from '../lib/loaders/gravity';
import cached from './fields/cached';
import Partner from './partner';
import {
  GraphQLString,
  GraphQLObjectType,
  GraphQLNonNull
} from 'graphql';

let PartnerCategoryType = new GraphQLObjectType({
  name: 'PartnerCategory',
  fields: () => ({
    cached: cached,
    id: {
      type: GraphQLString
    },
    name: {
      type: GraphQLString
    },
    category_type: {
      type: GraphQLString
    },
    partners: {
      type: Partner.type,
      resolve: ({ id }) => gravity('partners', {
        partner_categories: [id]
      })
    }
  })
});

let PartnerCategory = {
  type: PartnerCategoryType,
  description: 'A PartnerCategory',
  args: {
    id: {
      type: new GraphQLNonNull(GraphQLString),
      description: 'The slug or ID of the PartnerCategory'
    }
  },
  resolve: (root, { id }) => gravity(`partner_category/${id}`)
};

export default PartnerCategory;
