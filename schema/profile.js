import gravity from '../lib/loaders/gravity';
import cached from './fields/cached';
import initials from './fields/initials';
import numeral from './fields/numeral';
import Image from './image';
import { GravityIDFields } from './object_identification';
import {
  GraphQLString,
  GraphQLObjectType,
  GraphQLNonNull,
  GraphQLBoolean,
} from 'graphql';

const ProfileType = new GraphQLObjectType({
  name: 'Profile',
  fields: () => ({
    ...GravityIDFields,
    cached,
    bio: {
      type: GraphQLString,
    },
    counts: {
      resolve: (profile) => profile,
      type: new GraphQLObjectType({
        name: 'ProfileCounts',
        fields: {
          follows: numeral(({ follows_count }) => follows_count),
        },
      }),
    },
    href: {
      type: GraphQLString,
      resolve: ({ id }) => `/${id}`,
    },
    icon: {
      type: Image.type,
      resolve: ({ icon }) => Image.resolve(icon),
    },
    image: {
      type: Image.type,
      resolve: ({ cover_image }) => Image.resolve(cover_image),
    },
    initials: initials('owner.name'),
    is_published: {
      type: GraphQLBoolean,
      resolve: ({ published }) => published,
    },
    name: {
      type: GraphQLString,
      resolve: ({ owner }) => owner.name,
    },
  }),
});

const Profile = {
  type: ProfileType,
  description: 'A Profile',
  args: {
    id: {
      type: new GraphQLNonNull(GraphQLString),
      description: 'The slug or ID of the Profile',
    },
  },
  resolve: (root, { id }) => gravity(`profile/${id}`),
};

export default Profile;
