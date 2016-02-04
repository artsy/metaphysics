import gravity from '../lib/loaders/gravity';
import cached from './fields/cached';
import initials from './fields/initials';
import Image from './image';
import {
  GraphQLString,
  GraphQLObjectType,
  GraphQLNonNull,
} from 'graphql';

const ProfileType = new GraphQLObjectType({
  name: 'Profile',
  fields: () => ({
    cached,
    id: {
      type: GraphQLString,
    },
    name: {
      type: GraphQLString,
      resolve: ({ owner }) => owner.name,
    },
    image: {
      type: Image.type,
      resolve: ({ cover_image }) => Image.resolve(cover_image),
    },
    initials: initials('owner.name'),
    icon: {
      type: Image.type,
      resolve: ({ icon }) => Image.resolve(icon),
    },
    href: {
      type: GraphQLString,
      resolve: ({ id }) => `/${id}`,
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
