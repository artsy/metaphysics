import _ from 'lodash';
import gravity from '../lib/loaders/gravity';
import cached from './fields/cached';
import Profile from './profile';
import Location from './location';
import {
  GraphQLString,
  GraphQLObjectType,
  GraphQLNonNull,
  GraphQLInt,
  GraphQLList,
  GraphQLBoolean
} from 'graphql';

let PartnerType = new GraphQLObjectType({
  name: 'Partner',
  fields: () => ({
    cached: cached,
    _id: {
      type: GraphQLString
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
    href: {
      type: GraphQLString,
      resolve: ({ default_profile_id }) => `/${default_profile_id}`
    },
    is_linkable: {
      type: GraphQLBoolean,
      resolve: ({ default_profile_id, default_profile_public}) => default_profile_id && default_profile_public
    },
    initials: {
      type: GraphQLString,
      resolve: ({ name }) => _.take(name.replace(/[^A-Z]/g, ''), 3).join('')
    },
    default_profile_id: {
      type: GraphQLString
    },
    profile: {
      type: Profile.type,
      resolve: ({ default_profile_id }) => gravity(`profile/${default_profile_id}`)
    },
    type: {
      type: GraphQLString
    },
    locations: {
      type: new GraphQLList(Location.type),
      args: {
        size: {
          type: GraphQLInt
        }
      },
      resolve: ({ id }, options) => gravity(`partner/${id}/locations`, options)
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
