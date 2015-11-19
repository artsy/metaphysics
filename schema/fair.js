import gravity from '../lib/loaders/gravity';
import cached from './fields/cached';
import Profile from './profile';
import {
  GraphQLObjectType,
  GraphQLString,
  GraphQLNonNull
} from 'graphql';

let FairType = new GraphQLObjectType({
  name: 'Fair',
  fields: () => ({
    cached: cached,
    id: {
      type: GraphQLString
    },
    profile: {
      type: Profile.type,
      resolve: (fair) => {
        if (fair.default_profile_id !== null) {
          return gravity(`profile/${fair.default_profile_id}`)
        }
        else if (fair.organizer != null) {
          return gravity(`profile/${fair.organizer.profile_id}`)
        }
      }
    },
    organizer: {
      type: new GraphQLObjectType({
        name: 'organizer',
        fields: {
          profile_id: { type: GraphQLString }
        }
      })
    },
    default_profile_id: {
      type: GraphQLString
    }
  })
});

let Fair = {
  type: FairType,
  description: 'A Fair',
  args: {
    id: {
      type: new GraphQLNonNull(GraphQLString),
      description: 'The slug or ID of the Fair'
    }
  },
  resolve: (root, { id }) => gravity(`fair/${id}`)
};

export default Fair;
