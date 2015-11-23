import gravity from '../lib/loaders/gravity';
import Artist from './artist';
import ArtistSorts from './sorts/artist_sorts'
import {
  GraphQLList,
  GraphQLInt,
  GraphQLEnumType
} from 'graphql'

let Artists = {
  type: new GraphQLList(Artist.type),
  description: 'A list of Artists',
  args: {
    size: {
      type: GraphQLInt
    },
    sort: ArtistSorts
  },
  resolve: (root, options) => gravity('artists', options)
};

export default Artists;
