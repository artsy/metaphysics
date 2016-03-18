import date from './fields/date';
import Sale from './sale/index';
import {
  GraphQLString,
  GraphQLObjectType,
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
  }),
});

export default {
  type: BidderType,
};
