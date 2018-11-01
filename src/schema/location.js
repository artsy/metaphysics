import { existyValue } from "lib/helpers"
import cached from "./fields/cached"
import DayScheduleType from "./day_schedule"
import { IDFields } from "./object_identification"
import {
  GraphQLString,
  GraphQLObjectType,
  GraphQLFloat,
  GraphQLList,
} from "graphql"

export const LatLngType = new GraphQLObjectType({
  name: "LatLng",
  fields: {
    lat: {
      type: GraphQLFloat,
    },
    lng: {
      type: GraphQLFloat,
    },
  },
})

export const LocationType = new GraphQLObjectType({
  name: "Location",
  fields: () => ({
    ...IDFields,
    cached,
    address: {
      type: GraphQLString,
    },
    address_2: {
      type: GraphQLString,
    },
    city: {
      type: GraphQLString,
      resolve: ({ city }) => existyValue(city),
    },
    country: {
      type: GraphQLString,
    },
    coordinates: {
      type: LatLngType,
    },
    day_schedules: {
      type: new GraphQLList(DayScheduleType),
      resolve: ({ day_schedules }) => day_schedules,
    },
    display: {
      type: GraphQLString,
    },
    phone: {
      type: GraphQLString,
      resolve: ({ phone }) => existyValue(phone),
    },
    postal_code: {
      type: GraphQLString,
    },
    state: {
      type: GraphQLString,
    },
  }),
})

const Location = {
  type: LocationType,
  description: "A Location",
}

export default Location
