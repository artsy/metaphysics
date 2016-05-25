import gravity from '../../lib/loaders/gravity';
import { map } from 'lodash';
import { total as getTotal } from '../../lib/loaders/total';
import Artist from '../artist';
import {
  GraphQLInt,
  GraphQLList,
  GraphQLObjectType,
} from 'graphql';

const FollowArtists = new GraphQLObjectType({
  name: 'FollowArtists',
  fields: {
    artists: {
      type: new GraphQLList(Artist.type),
      resolve: (data) => {
        const artists = data.artists ? data.artists : data;
        return map(artists, 'artist');
      },
    },
    total_count: {
      type: GraphQLInt,
      resolve: (data, options, { rootValue: { accessToken } }) => {
        return getTotal('me/follow/artists?total_count=true', accessToken)
          .then(({ body: { total } }) => total);
      },
    },
  },
});

export default {
  type: FollowArtists,
  description: 'A list of the current user’s artist follows',
  args: {
    size: {
      type: GraphQLInt,
    },
    page: {
      type: GraphQLInt,
    },
  },
  resolve: (root, options, { rootValue: { accessToken } }) => {
    if (!accessToken) return null;
    return gravity.with(accessToken)('me/follow/artists', options);
  },
};
