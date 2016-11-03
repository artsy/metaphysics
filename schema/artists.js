/* @flow */

import {
  GraphQLList,
  GraphQLInt,
} from 'graphql';

import gravity from '../lib/loaders/gravity';
import Artist from './artist';
import ArtistSorts from './sorts/artist_sorts';

const Artists = {
  type: new GraphQLList(Artist.type),
  description: 'A list of Artists',
  args: {
    size: {
      type: GraphQLInt,
    },
    sort: ArtistSorts,
  },
  resolve: (root, options) => gravity('artists', options),
};

export default Artists;
