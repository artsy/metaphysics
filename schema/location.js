import { existyValue } from '../lib/helpers';
import cached from './fields/cached';
import DayScheduleType from './day_schedule';
import { IDFields } from './object_identification';
import {
  GraphQLString,
  GraphQLObjectType,
  GraphQLFloat,
  GraphQLList,
} from 'graphql';

const LocationType = new GraphQLObjectType({
  name: 'Location',
  fields: () => ({
    ...IDFields,
    cached,
    city: {
      type: GraphQLString,
      resolve: ({ city }) => existyValue(city),
    },
    country: {
      type: GraphQLString,
    },
    coordinates: {
      type: new GraphQLObjectType({
        name: 'coordinates',
        fields: {
          lat: {
            type: GraphQLFloat,
          },
          lng: {
            type: GraphQLFloat,
          },
        },
      }),
    },
    display: {
      type: GraphQLString,
    },
    address: {
      type: GraphQLString,
    },
    address_2: {
      type: GraphQLString,
    },
    postal_code: {
      type: GraphQLString,
    },
    state: {
      type: GraphQLString,
    },
    phone: {
      type: GraphQLString,
      resolve: ({ phone }) => existyValue(phone),
    },
    day_schedules: {
      type: new GraphQLList(DayScheduleType),
      resolve: ({ day_schedules }) => day_schedules,
    },
  }),
});

const Location = {
  type: LocationType,
  description: 'A Location',
};

export default Location;
