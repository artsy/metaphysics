import gravity from '../lib/loaders/gravity';
import cached from './fields/cached';
import date from './fields/date';
import Profile from './profile';
import {
  GraphQLObjectType,
  GraphQLString,
  GraphQLBoolean,
  GraphQLNonNull,
} from 'graphql';

const FairType = new GraphQLObjectType({
  name: 'Fair',
  fields: () => ({
    cached,
    _id: {
      type: GraphQLString,
    },
    id: {
      type: GraphQLString,
    },
    profile: {
      type: Profile.type,
      resolve: ({ default_profile_id, organizer }) => {
        const id = default_profile_id || organizer && organizer.profile_id;
        return gravity(`profile/${id}`);
      },
    },
    has_full_feature: {
      type: GraphQLBoolean,
    },
    href: {
      type: GraphQLString,
      resolve: ({ default_profile_id, organizer }) => {
        const id = default_profile_id || organizer && organizer.profile_id;
        return `/${id}`;
      },
    },
    start_at: date,
    end_at: date,
    name: {
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
      type: new GraphQLObjectType({
        name: 'organizer',
        fields: {
          profile_id: {
            type: GraphQLString,
          },
        },
      }),
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
