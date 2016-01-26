import gravity from '../lib/loaders/gravity';
import cached from './fields/cached';
import initials from './fields/initials';
import Profile from './profile';
import PartnerShow from './partner_show';
import Location from './location';
import {
  GraphQLString,
  GraphQLObjectType,
  GraphQLNonNull,
  GraphQLInt,
  GraphQLList,
  GraphQLBoolean,
} from 'graphql';

const PartnerType = new GraphQLObjectType({
  name: 'Partner',
  fields: () => ({
    cached,
    _id: {
      type: GraphQLString,
    },
    id: {
      type: GraphQLString,
    },
    name: {
      type: GraphQLString,
    },
    type: {
      type: GraphQLString,
    },
    href: {
      type: GraphQLString,
      resolve: ({ default_profile_id }) => `/${default_profile_id}`,
    },
    is_linkable: {
      type: GraphQLBoolean,
      resolve: ({ default_profile_id, default_profile_public }) => {
        return default_profile_id && default_profile_public;
      },
    },
    initials: initials('name'),
    default_profile_id: {
      type: GraphQLString,
    },
    profile: {
      type: Profile.type,
      resolve: ({ default_profile_id }) => gravity(`profile/${default_profile_id}`),
    },
    shows: {
      type: new GraphQLList(PartnerShow.type),
      args: {
        size: {
          type: GraphQLInt,
        },
      },
      resolve: ({ id }, options) => gravity(`partner/${id}/shows`, options),
    },
    locations: {
      type: new GraphQLList(Location.type),
      args: {
        size: {
          type: GraphQLInt,
        },
      },
      resolve: ({ id }, options) => gravity(`partner/${id}/locations`, options),
    },
  }),
});

const Partner = {
  type: PartnerType,
  description: 'A Partner',
  args: {
    id: {
      type: new GraphQLNonNull(GraphQLString),
      description: 'The slug or ID of the Partner',
    },
  },
  resolve: (root, { id }) => gravity(`partner/${id}`),
};

export default Partner;
