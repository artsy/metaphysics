import gravity from '../lib/loaders/gravity';
import cached from './fields/cached';
import Image from './image';
import {
  GraphQLString,
  GraphQLObjectType,
  GraphQLNonNull,
  GraphQLInt
} from 'graphql';

let ProfileType = new GraphQLObjectType({
  name: 'Profile',
  fields: () => ({
    cached: cached,
    id: {
      type: GraphQLString
    },
    name: {
      type: GraphQLString,
      resolve: ({ owner }) => owner.name
    },
    image: {
      type: Image.type,
      resolve: ({ cover_image }) => cover_image
    }
  })
});

let Profile = {
  type: ProfileType,
  description: 'A Profile',
  args: {
    id: {
      type: new GraphQLNonNull(GraphQLString),
      description: 'The slug or ID of the Profile'
    }
  },
  resolve: (root, { id }) => gravity(`profile/${id}`)
};

export default Profile;
