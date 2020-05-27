import { existyValue } from "lib/helpers"
import cached from "./fields/cached"
import DayScheduleType from "./day_schedule"
import { FormattedDaySchedules } from "./types/formattedDaySchedules"
import { IDFields } from "./object_identification"
import {
  GraphQLString,
  GraphQLObjectType,
  GraphQLFloat,
  GraphQLList,
  GraphQLFieldConfig,
  GraphQLUnionType,
} from "graphql"
import { ResolverContext } from "types/graphql"
import { connectionWithCursorInfo } from "./fields/pagination"

export const LatLngType = new GraphQLObjectType<any, ResolverContext>({
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

const OpeningHoursText = new GraphQLObjectType<any, ResolverContext>({
  name: "OpeningHoursText",
  fields: {
    text: {
      type: GraphQLString,
      resolve: (ops) => ops.day_schedule_text,
    },
  },
})

const OpeningHoursArray = new GraphQLObjectType<any, ResolverContext>({
  name: "OpeningHoursArray",
  fields: {
    schedules: {
      type: new GraphQLList(FormattedDaySchedules.type),
      resolve: ({ day_schedules }) =>
        FormattedDaySchedules.resolve(day_schedules),
    },
  },
})

const OpeningHoursUnion = new GraphQLUnionType({
  name: "OpeningHoursUnion",
  types: [OpeningHoursArray, OpeningHoursText],
  resolveType: (object) => {
    if (object.day_schedules && object.day_schedules.length > 0) {
      return OpeningHoursArray
    } else return OpeningHoursText
  },
})

export const LocationType = new GraphQLObjectType<any, ResolverContext>({
  name: "Location",
  fields: () => ({
    ...IDFields,
    cached,
    address: {
      type: GraphQLString,
    },
    address2: {
      type: GraphQLString,
      resolve: ({ address_2 }) => address_2,
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
    daySchedules: {
      type: new GraphQLList(DayScheduleType),
      resolve: ({ day_schedules }) => day_schedules,
    },
    dayScheduleText: {
      description:
        "Alternate Markdown-supporting free text representation of a location's opening hours",
      type: GraphQLString,
      resolve: ({ day_schedule_text }) => day_schedule_text,
    },

    openingHours: {
      type: OpeningHoursUnion,
      resolve: ({ day_schedules, day_schedule_text }) =>
        day_schedules && day_schedules.length > 0
          ? { day_schedules }
          : { day_schedule_text },
      description:
        "Union returning opening hours in formatted structure or a string",
    },

    display: {
      type: GraphQLString,
    },
    phone: {
      type: GraphQLString,
      resolve: ({ phone }) => existyValue(phone),
    },
    postalCode: {
      type: GraphQLString,
      resolve: ({ postal_code }) => postal_code,
    },
    state: {
      type: GraphQLString,
    },
    summary: {
      type: GraphQLString,
    },
  }),
})

export const LocationField: GraphQLFieldConfig<void, ResolverContext> = {
  type: LocationType,
  description: "A Location",
}

export const locationsConnection = connectionWithCursorInfo({
  nodeType: LocationType,
})
