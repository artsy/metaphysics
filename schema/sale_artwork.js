import _ from 'lodash';
import qs from 'qs';
import cached from './fields/cached';
import date from './fields/date';
import Image from './image';
import Artist from './artist';
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
    return {
      cached: cached,
      _id: {
        type: GraphQLString
      },
      id: {
        type: GraphQLString
      },
      sale_id: {
        type: GraphQLString
      },
      position: {
        type: GraphQLInt
      },
      lot_number: {
        type: GraphQLString
      },
      bidder_positions_count: {
        type: GraphQLInt
      },
      reserve_status: {
        type: GraphQLString
      },
      low_estimate_cents: {
        type: GraphQLString
      },
      high_estimate_cents: {
        type: GraphQLString
      },
      opening_bid_cents: {
        type: GraphQLString
      },
      currency: {
        type: GraphQLString
      },
      symbol: {
        type: GraphQLString
      },
      minimum_next_bid_cents: {
        type: GraphQLString
      },
      highest_bid: {
        type: new GraphQLObjectType({
          name: 'highest_bid',
          fields: {
            created_at: date,
            amount_cents: {
              type: GraphQLString
            }
          }
        })
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
