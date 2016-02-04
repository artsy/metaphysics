import gravity from '../lib/loaders/gravity';
import SaleArtwork from './sale_artwork';
import {
  GraphQLString,
  GraphQLList,
} from 'graphql';

const SaleArtworks = {
  type: new GraphQLList(SaleArtwork.type),
  description: 'A list of Sale Artworks',
  args: {
    ids: {
      type: new GraphQLList(GraphQLString),
      description: 'A list of sale artwork ids',
    },
  },
  resolve: (root, options) => {
    return Promise.all(options.ids.map(id => gravity(`sale_artwork/${id}`)));
  },
};

export default SaleArtworks;
