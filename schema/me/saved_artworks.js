import gravity from '../../lib/loaders/gravity';
import { map } from 'lodash';
import { total as getTotal } from '../../lib/loaders/total';
import Artist from '../artist';
import {
  GraphQLInt,
  GraphQLList,
  GraphQLObjectType,
} from 'graphql';

const SavedArtworks = new GraphQLObjectType({
  name: 'SavedArtworks',
  fields: {
    artorks: {
      type: new GraphQLList(Artist.type),
      resolve: (data) => {
        const artists = data.artists ? data.artists : data;
        return map(artists, 'artist');
      },
    },
    counts: {
      type: new GraphQLObjectType({
        name: 'FollowArtistCounts',
        fields: {
          artists: {
            type: GraphQLInt,
            resolve: (data, options, request, { rootValue: { accessToken } }) => {
              return getTotal('me/follow/artists', accessToken, { total_count: true })
                .then(({ body: { total } }) => total);
            },
          },
        },
      }),
      resolve: (follows) => follows,
    },
  },
});

export default {
  type: SavedArtworks,
  description: 'A list of artworks the user has saved',
  args: {
    page: {
      type: GraphQLInt,
    },
    size: {
      type: GraphQLInt,
    },
  },
  resolve: (root, options, request, { rootValue: { accessToken } }) => {
    if (!accessToken) return null;
    return gravity.with(accessToken)('me/follow/artists', options);
  },
};
