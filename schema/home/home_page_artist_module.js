import { map } from 'lodash';
import Artist from '../artist';
import gravity from '../../lib/loaders/gravity';
import {
  GraphQLID,
  GraphQLNonNull,
  GraphQLList,
  GraphQLObjectType,
  GraphQLString,
} from 'graphql';

export const Results = {
  suggested: ({ accessToken, userID }) => {
    return gravity.with(accessToken)(`user/${userID}/suggested/similar/artists`).then(results => {
      return map(results, 'artist');
    });
  },
  trending: () => gravity('artists/trending'),
  iconic: () => [],
};

export const HomePageArtistModuleType = new GraphQLObjectType({
  name: 'HomePageArtistModule',
  fields: {
    key: {
      type: GraphQLString,
    },
    results: {
      type: new GraphQLList(Artist.type),
      resolve: ({ key, display, params }, options, { rootValue: { accessToken, userID } }) => {
        // TODO figure out what `display` is supposed to do
        return Results[key]({ accessToken, userID });
      },
    },
  },
});

const HomePageArtistModule = {
  type: HomePageArtistModuleType,
  args: {
    key: {
      type: GraphQLString,
      description: 'Module key',
    },
  },
  resolve: (root, { key }) => {
    if (Results.hasOwnProperty(key)) {
      return { key, display: true };
    }
  },
};

export default HomePageArtistModule;
