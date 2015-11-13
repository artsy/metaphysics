import gravity from '../lib/loaders/gravity';
import Artist from './artist';
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
    sort: {
      type: new GraphQLEnumType({
        name: 'ArtistSorts',
        values: {
          'sortable_id_asc': { value: 'sortable_id' },
          'sortable_id_desc': { value: '-sortable_id' },
          'trending_desc': { value: '-trending' }
        }
      })
    }
  },
  resolve: (root, options) => gravity('artists', options)
};

export default Artists;
