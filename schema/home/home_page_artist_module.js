import {
  has,
  map,
} from 'lodash';
import Artist from '../artist';
import gravity from '../../lib/loaders/gravity';
import { total } from '../../lib/loaders/total';
import { NodeInterface } from '../object_identification';
import { toGlobalId } from 'graphql-relay';
import {
  GraphQLEnumType,
  GraphQLID,
  GraphQLNonNull,
  GraphQLList,
  GraphQLObjectType,
  GraphQLString,
} from 'graphql';

function fetchArtists(path) {
  return (accessToken) => {
    const loader = accessToken ? gravity.with(accessToken) : gravity;
    return loader(path, accessToken && { exclude_followed_artists: true });
  };
}

// This object is used for both the `key` argument enum and to do fetching.
export const HomePageArtistModuleTypes = {
  SUGGESTED: {
    description: 'Artists recommended for the specific user.',
    display: (accessToken, userID) => {
      if (!accessToken || !userID) {
        return Promise.resolve(false);
      }
      return total(`user/${userID}/suggested/similar/artists`, accessToken, {
        exclude_followed_artists: true,
        exclude_artists_without_forsale_artworks: true,
      }).then(response => response.body.total > 0);
    },
    resolve: (accessToken, userID) => {
      if (!accessToken || !userID) {
        throw new Error('Both the X-USER-ID and X-ACCESS-TOKEN headers are required.');
      }
      return gravity.with(accessToken)(`user/${userID}/suggested/similar/artists`, {
        exclude_followed_artists: true,
        exclude_artists_without_forsale_artworks: true,
      }).then(results => map(results, 'artist'));
    },
  },
  TRENDING: {
    description: 'The trending artists.',
    display: () => Promise.resolve(true),
    resolve: fetchArtists('artists/trending'),
  },
  POPULAR: {
    description: 'The most searched for artists.',
    display: () => Promise.resolve(true),
    resolve: fetchArtists('artists/popular'),
  },
};

export const HomePageArtistModuleType = new GraphQLObjectType({
  name: 'HomePageArtistModule',
  interfaces: [NodeInterface],
  isTypeOf: (obj) => has(obj, 'key') && !has(obj, 'display'),
  fields: {
    __id: {
      type: new GraphQLNonNull(GraphQLID),
      description: 'A globally unique ID.',
      resolve: ({ key }) => {
        return toGlobalId('HomePageArtistModule', JSON.stringify({ key }));
      },
    },
    key: {
      description: 'Module identifier.',
      type: GraphQLString,
    },
    results: {
      type: new GraphQLList(Artist.type),
      resolve: ({ key }, options, request, { rootValue: { accessToken, userID } }) => {
        return HomePageArtistModuleTypes[key].resolve(accessToken, userID);
      },
    },
  },
});

const HomePageArtistModule = {
  type: HomePageArtistModuleType,
  description: 'Single artist module to show on the home screen.',
  args: {
    key: {
      description: 'Module identifier.',
      type: new GraphQLEnumType({
        name: 'HomePageArtistModuleTypes',
        values: HomePageArtistModuleTypes,
      }),
    },
  },
  resolve: (root, obj) => obj.key && HomePageArtistModuleTypes[obj.key] ? obj : null,
};

export default HomePageArtistModule;
