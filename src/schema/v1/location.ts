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
import { deprecate } from "lib/deprecation"

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
    day_schedule_text: {
      description:
        "Alternate Markdown-supporting free text representation of a location's opening hours",
      type: GraphQLString,
    },

    displayDaySchedules: {
      type: new GraphQLList(FormattedDaySchedules.type),
      resolve: ({ day_schedules }) =>
        FormattedDaySchedules.resolve(day_schedules),
      deprecationReason: deprecate({
        inVersion: 2,
        preferUsageOf: "openingHours",
      }),
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
    postal_code: {
      type: GraphQLString,
    },
    state: {
      type: GraphQLString,
    },
    summary: {
      type: GraphQLString,
    },
  }),
})

const Location: GraphQLFieldConfig<void, ResolverContext> = {
  type: LocationType,
  description: "A Location",
}

export default Location
