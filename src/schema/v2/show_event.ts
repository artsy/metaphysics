import dateField, { date, DateSource } from "./fields/date"
import { GraphQLString, GraphQLObjectType, GraphQLFieldConfig } from "graphql"
import { ResolverContext } from "types/graphql"
import { dateRange, dateTimeRange } from "lib/date"
import { snakeCase } from "lodash"

const hasOldEmissionUserAgentString = (userAgent: string | string[]): boolean =>
  userAgent!.indexOf("Artsy-Mobile/4.4") > 0 ||
  userAgent!.indexOf("Artsy-Mobile/5.0.0") > 0 ||
  userAgent!.indexOf("Artsy-Mobile/5.0.1") > 0

const isOlderEmissionVersion = (userAgent: string | string[]): boolean => {
  let result = false
  if (typeof userAgent === "string") {
    result = hasOldEmissionUserAgentString(userAgent)
  } else if (Array.isArray(userAgent)) {
    result = userAgent.some(hasOldEmissionUserAgentString)
  }
  return result
}

const dateFieldForShowEvent: GraphQLFieldConfig<DateSource, ResolverContext> = {
  ...dateField,
  resolve: (
    obj,
    { format, timezone },
    { defaultTimezone, userAgent },
    { fieldName }
  ) => {
    const rawDate = obj[snakeCase(fieldName)]

    if (userAgent && isOlderEmissionVersion(userAgent)) {
      const dateWithoutOffset = rawDate.replace(/[-+]\d\d:\d\d$/, "")
      return dateWithoutOffset
    }

    const timezoneString = timezone ? timezone : defaultTimezone
    return date(rawDate, format, timezoneString)
  },
}

const ShowEventType = new GraphQLObjectType<any, ResolverContext>({
  name: "ShowEventType",
  fields: {
    eventType: {
      type: GraphQLString,
      resolve: ({ event_type }) => {
        return event_type === "Other" ? "Event" : event_type
      },
    },
    description: {
      type: GraphQLString,
    },
    title: {
      type: GraphQLString,
    },
    startAt: dateFieldForShowEvent,
    endAt: dateFieldForShowEvent,
    dateTimeRange: {
      type: GraphQLString,
      description: "A formatted description of the dates with hours",
      resolve: ({ start_at, end_at }) =>
        dateTimeRange(start_at, end_at, "UTC", true),
    },
    exhibitionPeriod: {
      type: GraphQLString,
      description: "A formatted description of the start to end dates",
      resolve: ({ start_at, end_at }) => dateRange(start_at, end_at, "UTC"),
    },
  },
})

export default ShowEventType
