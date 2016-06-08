import date from './fields/date';
import Sale from './sale/index';
import {
  GraphQLString,
  GraphQLObjectType,
  GraphQLBoolean,
} from 'graphql';

const BidderType = new GraphQLObjectType({
  name: 'Bidder',
  fields: () => ({
    id: {
      type: GraphQLString,
    },
    created_at: date,
    pin: {
      type: GraphQLString,
    },
    sale: {
      type: Sale.type,
    },
    qualified_for_bidding: {
      type: GraphQLBoolean,
    },
  }),
});

export default {
  type: BidderType,
};
