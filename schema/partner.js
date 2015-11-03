import gravity from '../lib/loaders/gravity';
import {
  GraphQLString,
  GraphQLObjectType,
  GraphQLNonNull,
  GraphQLInt
} from 'graphql';

let PartnerType = new GraphQLObjectType({
  name: 'Partner',
  fields: () => ({
    cached: {
      type: GraphQLInt,
      resolve: ({ cached }) => new Date().getTime() - cached
    },
    id: {
      type: GraphQLString
    },
    name: {
      type: GraphQLString
    },
    type: {
      type: GraphQLString
    },
    default_profile_id: {
      type: GraphQLString
    }
  })
});

let Partner = {
  type: PartnerType,
  description: 'A Partner',
  args: {
    id: {
      type: new GraphQLNonNull(GraphQLString),
      description: 'The slug or ID of the Partner'
    }
  },
  resolve: (root, { id }) => gravity(`partner/${id}`)
};

export default Partner;
