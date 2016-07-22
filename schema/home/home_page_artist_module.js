import {
  has,
  map,
} from 'lodash';
import Artist from '../artist';
import gravity from '../../lib/loaders/gravity';
import { NodeInterface } from '../object_identification';
import { toGlobalId } from 'graphql-relay';
import {
  GraphQLID,
  GraphQLNonNull,
  GraphQLList,
  GraphQLObjectType,
  GraphQLString,
} from 'graphql';

export const Results = {
  suggested: {
    fetch: (accessToken, userID) => {
      return gravity.with(accessToken)(`user/${userID}/suggested/similar/artists`);
    },
    display: (accessToken, userID) => {
      return Promise.resolve(!!(accessToken && userID)).then(display => {
        return display && Results.suggested.fetch(accessToken, userID).then(results => {
          return results.length > 0;
        });
      });
    },
    resolve: (accessToken, userID) => {
      if (accessToken && userID) {
        return Results.suggested.fetch(accessToken, userID).then(results => {
          return map(results, 'artist');
        });
      }
    },
  },
  trending: {
    display: () => Promise.resolve(true),
    resolve: () => gravity('artists/trending'),
  },
  popular: {
    display: () => Promise.resolve(true),
    resolve: () => [],
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
      type: GraphQLString,
    },
    results: {
      type: new GraphQLList(Artist.type),
      resolve: ({ key, display, params }, options, { rootValue: { accessToken, userID } }) => {
        return Results[key].resolve(accessToken, userID);
      },
    },
  },
});

const HomePageArtistModule = {
  type: HomePageArtistModuleType,
  description: 'Single artist module to show on the home screen',
  args: {
    key: {
      type: GraphQLString,
      description: 'Module key',
    },
  },
  resolve: (root, obj) => obj.key && Results[obj.key] ? obj : null,
};

export default HomePageArtistModule;
