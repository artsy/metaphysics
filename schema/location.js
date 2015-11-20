import cached from './fields/cached';
import DayScheduleType from './day_schedule';
import {
  GraphQLString,
  GraphQLObjectType,
  GraphQLFloat,
  GraphQLInt,
  GraphQLList
} from 'graphql';

let LocationType = new GraphQLObjectType({
  name: 'Location',
  fields: () => ({
    cached: cached,
    id: {
      type: GraphQLString
    },
    city: {
      type: GraphQLString
    },
    country: {
      type: GraphQLString
    },
    coordinates: {
      type: new GraphQLObjectType({
        name: 'coordinates',
        fields: {
          lat: { type: GraphQLFloat },
          lng: { type: GraphQLFloat }
        }
      })
    },
    display: {
      type: GraphQLString
    },
    address: {
      type: GraphQLString
    },
    address_2: {
      type: GraphQLString
    },
    postal_code: {
      type: GraphQLString
    },
    day_schedules: {
      type: new GraphQLList(DayScheduleType),
      resolve: ({ day_schedules }) => day_schedules
    }
  })
});

let Location = {
  type: LocationType,
  description: 'A Location'
};

export default Location;
