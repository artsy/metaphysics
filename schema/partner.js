import {
  assign,
  omit,
} from 'lodash';
import gravity from '../lib/loaders/gravity';
import cached from './fields/cached';
import initials from './fields/initials';
import Profile from './profile';
import Location from './location';
import { GravityIDFields, NodeInterface } from './object_identification';
import {
  GraphQLID,
  GraphQLString,
  GraphQLObjectType,
  GraphQLNonNull,
  GraphQLInt,
  GraphQLList,
  GraphQLBoolean,
} from 'graphql';

const PartnerType = new GraphQLObjectType({
  name: 'Partner',
  interfaces: [NodeInterface],
  fields: () => {
    // Prevent circular dependency
    const PartnerShows = require('./partner_shows').default;

    return {
      ...GravityIDFields,
      cached,
      name: {
        type: GraphQLString,
        resolve: ({ name }) => name.trim(),
      },
      collecting_institution: {
        type: GraphQLString,
      },
      is_default_profile_public: {
        type: GraphQLBoolean,
        resolve: ({ default_profile_public }) => default_profile_public,
      },
      type: {
        type: GraphQLString,
        resolve: ({ name, type }) => {
          const exceptions = {
            Auction: 'Auction House',
            Brand: name,
            'Institutional Seller': 'Institution',
          };

          return exceptions[type] || type;
        },
      },
      href: {
        type: GraphQLString,
        resolve: ({ default_profile_id }) => `/${default_profile_id}`,
      },
      is_linkable: {
        type: GraphQLBoolean,
        resolve: ({ default_profile_id, default_profile_public, type }) =>
          default_profile_id && default_profile_public && type !== 'Auction',
      },
      is_pre_qualify: {
        type: GraphQLBoolean,
        resolve: ({ pre_qualify }) => pre_qualify,
      },
      is_limited_fair_partner: {
        type: GraphQLBoolean,
        resolve: ({ has_limited_fair_partnership }) => has_limited_fair_partnership,
      },
      initials: initials('name'),
      default_profile_id: {
        type: GraphQLString,
      },
      profile: {
        type: Profile.type,
        resolve: ({ default_profile_id }) =>
          gravity(`profile/${default_profile_id}`)
            .catch(() => null),
      },
      shows: {
        type: PartnerShows.type,
        args: omit(PartnerShows.args, 'partner_id'),
        resolve: ({ _id }, options) => {
          return PartnerShows.resolve(null, assign({}, options, {
            partner_id: _id,
          }));
        },
      },
      locations: {
        type: new GraphQLList(Location.type),
        args: {
          size: {
            type: GraphQLInt,
            defaultValue: 25,
          },
        },
        resolve: ({ id }, options) => gravity(`partner/${id}/locations`, options),
      },
      contact_message: {
        type: GraphQLString,
        resolve: ({ type }) => {
          if (type === 'Auction') {
            return [
              'Hello, I am interested in placing a bid on this work.',
              'Please send me more information.',
            ].join(' ');
          }
          return [
            'Hi, I’m interested in purchasing this work.',
            'Could you please provide more information about the piece?',
          ].join(' ');
        },
      },
    };
  },
});

const Partner = {
  type: PartnerType,
  description: 'A Partner',
  args: {
    id: {
      type: new GraphQLNonNull(GraphQLID),
      description: 'The slug or ID of the Partner',
    },
  },
  resolve: (root, { id }) => gravity(`partner/${id}`),
  // ObjectIdentification
  isType: (obj) => obj.has_full_profile !== undefined && obj.shows_count !== undefined,
};

export default Partner;
