import gravity from '../lib/loaders/gravity';
import moment from 'moment';
import cached from './fields/cached';
import date from './fields/date';
import Profile from './profile';
import Image from './image';
import Location from './location';
import { GravityIDFields } from './object_identification';
import {
  GraphQLObjectType,
  GraphQLID,
  GraphQLString,
  GraphQLBoolean,
  GraphQLNonNull,
} from 'graphql';

const FairOrganizerType = new GraphQLObjectType({
  name: 'organizer',
  fields: {
    profile_id: {
      type: GraphQLID,
    },
  },
});

const FairType = new GraphQLObjectType({
  name: 'Fair',
  fields: () => ({
    ...GravityIDFields,
    cached,
    banner_size: {
      type: GraphQLString,
    },
    profile: {
      type: Profile.type,
      resolve: ({ default_profile_id, organizer }) => {
        const id = default_profile_id || organizer && organizer.profile_id;
        return gravity(`profile/${id}`)
          // Some profiles are private and return 403
          .catch(() => null);
      },
    },
    has_full_feature: {
      type: GraphQLBoolean,
    },
    has_homepage_section: {
      type: GraphQLBoolean,
    },
    has_listing: {
      type: GraphQLBoolean,
    },
    has_large_banner: {
      type: GraphQLBoolean,
    },
    href: {
      type: GraphQLString,
      resolve: ({ default_profile_id, organizer }) => {
        const id = default_profile_id || organizer && organizer.profile_id;
        return `/${id}`;
      },
    },
    image: Image,
    location: {
      type: Location.type,
      resolve: ({ id, location, published }, options) => {
        if (location) {
          return location;
        } else if (published) {
          return gravity(`fair/${id}`, options)
            .then(fair => {
              return fair.location;
            });
        }
        return null;
      },
    },
    is_active: {
      type: GraphQLBoolean,
      description: 'Are we currently in the fair\'s active period?',
      resolve: ({ autopublish_artworks_at, end_at }) => {
        const start = moment.utc(autopublish_artworks_at).subtract(7, 'days');
        const end = moment.utc(end_at).add(14, 'days');
        return moment.utc().isBetween(start, end);
      },
    },
    start_at: date,
    end_at: date,
    name: {
      type: GraphQLString,
    },
    tagline: {
      type: GraphQLString,
    },
    published: {
      type: GraphQLBoolean,
      deprecationReason: 'Prefix Boolean returning fields with `is_`',
    },
    is_published: {
      type: GraphQLBoolean,
      resolve: ({ published }) => published,
    },
    organizer: {
      type: FairOrganizerType,
    },
  }),
});

const Fair = {
  type: FairType,
  description: 'A Fair',
  args: {
    id: {
      type: new GraphQLNonNull(GraphQLString),
      description: 'The slug or ID of the Fair',
    },
  },
  resolve: (root, { id }) => gravity(`fair/${id}`),
};

export default Fair;
