import date from './fields/date';
import Sale from './sale/index';
import { IDFields } from './object_identification';
import {
  GraphQLString,
  GraphQLObjectType,
  GraphQLBoolean,
} from 'graphql';

const BidderType = new GraphQLObjectType({
  name: 'Bidder',
  fields: () => ({
    ...IDFields,
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
