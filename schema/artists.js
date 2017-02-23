import gravity from '../lib/loaders/gravity';
import Artist from './artist';
import ArtistSorts from './sorts/artist_sorts';
import {
  GraphQLList,
  GraphQLInt,
} from 'graphql';

const Artists = {
  type: new GraphQLList(Artist.type),
  description: 'A list of Artists',
  args: {
    size: {
      type: GraphQLInt,
    },
    sort: ArtistSorts,
    page: {
      type: GraphQLInt,
      defaultValue: 1,
    },
  },
  resolve: (root, options) => gravity('artists', options),
};

export default Artists;
