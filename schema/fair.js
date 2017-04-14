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
    has_full_feature: {
      type: GraphQLBoolean,
    },
    has_homepage_section: {
      type: GraphQLBoolean,
    },
    has_large_banner: {
      type: GraphQLBoolean,
    },
    has_listing: {
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
    is_active: {
      type: GraphQLBoolean,
      description: 'Are we currently in the fair\'s active period?',
      resolve: ({ autopublish_artworks_at, end_at }) => {
        const start = moment.utc(autopublish_artworks_at).subtract(7, 'days');
        const end = moment.utc(end_at).add(14, 'days');
        return moment.utc().isBetween(start, end);
      },
    },
    is_published: {
      type: GraphQLBoolean,
      resolve: ({ published }) => published,
    },
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
    name: {
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
    start_at: date,
    end_at: date,
    organizer: {
      type: FairOrganizerType,
    },
    has_published_organizer_profile: {
      type: new GraphQLNonNull(GraphQLBoolean),
      resolve: ({ organizer }) => {
        const id = organizer && organizer.profile_id;
        if (id === null) return false;
        return gravity(`profile/${id}`).then(profile => profile && profile.published && !profile.private);
      },
    },
    published: {
      type: GraphQLBoolean,
      deprecationReason: 'Prefix Boolean returning fields with `is_`',
    },
    tagline: {
      type: GraphQLString,
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
