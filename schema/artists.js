import gravity from '../lib/loaders/gravity';
import Artist from './artist';
import ArtistSorts from './sorts/artist_sorts';
import {
  GraphQLList,
  GraphQLInt,
  GraphQLID,
} from 'graphql';

const Artists = {
  type: new GraphQLList(Artist.type),
  description: 'A list of Artists',
  args: {
    size: {
      type: GraphQLInt,
    },
    sale_id: {
      type: GraphQLID,
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
