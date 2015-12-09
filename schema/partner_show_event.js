import date from './fields/date';
import {
  GraphQLString,
  GraphQLObjectType
} from 'graphql';

let PartnerShowEventType = new GraphQLObjectType({
  name: 'PartnerShowEventType',
  fields: {
    title: {
      type: GraphQLString
    },
    description: {
      type: GraphQLString
    },
    event_type: {
      type: GraphQLString
    },
    start_at: date,
    end_at: date
  }
});

export default PartnerShowEventType;