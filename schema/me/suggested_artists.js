import gravity from '../../lib/loaders/gravity';
import Artist from '../artist';
import {
  GraphQLBoolean,
  GraphQLList,
  GraphQLString,
  GraphQLInt,
} from 'graphql';

export default {
  type: new GraphQLList(Artist.type),
  description: 'A list of the current user’s suggested artists, based on a single artist',
  args: {
    artist_id: {
      type: GraphQLString,
      description: 'The slug or ID of an artist',
    },
    exclude_artists_without_forsale_artworks: {
      type: GraphQLBoolean,
      description: 'Exclude artists without for sale works',
    },
    exclude_artists_without_artworks: {
      type: GraphQLBoolean,
      description: 'Exclude artists without any artworks',
    },
    exclude_followed_artists: {
      type: GraphQLBoolean,
      description: 'Exclude artists the user already follows',
    },
    size: {
      type: GraphQLInt,
      description: 'Amount of artists to return',
    },
    page: {
      type: GraphQLInt,
      description: 'Pagination, need I say more?',
    },
  },
  resolve: (root, options, request, { rootValue: { accessToken } }) => {
    if (!accessToken) return null;
    if (!options.artist_id) return null;
    return gravity.with(accessToken)('me/suggested/artists', options);
  },
};
