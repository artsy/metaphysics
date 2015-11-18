import _ from 'lodash';
import qs from 'qs';
import cached from './fields/cached';
import Image from './image';
import Artwork from './artwork';
import gravity from '../lib/loaders/gravity';
import {
  GraphQLObjectType,
  GraphQLBoolean,
  GraphQLString,
  GraphQLNonNull,
  GraphQLList,
  GraphQLInt
} from 'graphql';

let SaleArtworkType = new GraphQLObjectType({
  name: 'SaleArtwork',
  fields: () => {
    let Artist = require('./artist');

    return {
      cached: cached,
      id: {
        type: GraphQLString
      },
      position: {
        type: GraphQLString
      },
      lot_number: {
        type: GraphQLString
      },
      reserve_status: {
        type: GraphQLString
      },
      date: {
        type: GraphQLString
      },
      display_opening_bid_dollars: {
        type: GraphQLString
      },
      display_minimum_next_bid_dollars: {
        type: GraphQLString
      },
      artwork: {
        type: Artwork.type,
        resolve: ({ artwork }) => artwork
      }
    }
  }
});

let SaleArtwork = {
  type: SaleArtworkType,
  description: 'A Sale Artwork',
  args: {
    sale_id: {
      type: new GraphQLNonNull(GraphQLString),
      description: 'The slug or ID of the Sale'
    },
    id: {
      type: new GraphQLNonNull(GraphQLString),
      description: 'The slug or ID of the SaleArtwork'
    }
  },
  resolve: (root, { sale_id, id }) => {
    return gravity(`sale/${sale_id}/sale_artwork/${id}`)
  }
};

export default SaleArtwork;
