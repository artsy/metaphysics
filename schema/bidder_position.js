import date from './fields/date';
import {
  GraphQLInt,
  GraphQLBoolean,
  GraphQLString,
  GraphQLObjectType,
} from 'graphql';

const BidderPositionType = new GraphQLObjectType({
  name: 'BidderPosition',
  fields: () => ({
    id: {
      type: GraphQLString,
    },
    created_at: date,
    updated_at: date,
    processed_at: date,
    is_active: {
      type: GraphQLBoolean,
      resolve: ({ active }) => active,
    },
    is_retracted: {
      type: GraphQLBoolean,
      resolve: ({ retracted }) => retracted,
    },
    is_with_bid_max: {
      type: GraphQLBoolean,
      resolve: ({ bid_max }) => bid_max,
    },
    display_max_bid_amount_dollars: {
      type: GraphQLString,
    },
    display_suggested_next_bid_dollars: {
      type: GraphQLString,
    },
    max_bid_amount_cents: {
      type: GraphQLInt,
    },
    suggested_next_bid_cents: {
      type: GraphQLInt,
    },
    highest_bid: {
      type: new GraphQLObjectType({
        name: 'HighestBid',
        fields: {
          id: {
            type: GraphQLString,
          },
          created_at: date,
          number: {
            type: GraphQLInt,
          },
          is_cancelled: {
            type: GraphQLBoolean,
            resolve: ({ cancelled }) => cancelled,
          },
          amount_cents: {
            type: GraphQLInt,
          },
          display_amount_dollars: {
            type: GraphQLString,
          },
        },
      }),
    },
  }),
});

const BidderPosition = {
  type: BidderPositionType,
  description: 'An BidderPosition',
};

export default BidderPosition;
