import dateField, { date, DateSource } from "./fields/date"
import { GraphQLString, GraphQLObjectType, GraphQLFieldConfig } from "graphql"
import { ResolverContext } from "types/graphql"
import { exhibitionPeriod } from "lib/date"

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

const dateFieldForPartnerShowEvent: GraphQLFieldConfig<
  DateSource,
  ResolverContext
> = {
  ...dateField,
  resolve: (
    obj,
    { format, timezone },
    { defaultTimezone, userAgent },
    { fieldName }
  ) => {
    const rawDate = obj[fieldName]

    if (userAgent && isOlderEmissionVersion(userAgent)) {
      const dateWithoutOffset = rawDate.replace(/[-+]\d\d:\d\d$/, "")
      return dateWithoutOffset
    }

    const timezoneString = timezone ? timezone : defaultTimezone
    return date(rawDate, format, timezoneString)
  },
}

const PartnerShowEventType = new GraphQLObjectType<any, ResolverContext>({
  name: "PartnerShowEventType",
  fields: {
    event_type: {
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
    start_at: dateFieldForPartnerShowEvent,
    end_at: dateFieldForPartnerShowEvent,
    exhibitionPeriod: {
      type: GraphQLString,
      description: "A formatted description of the start to end dates",
      resolve: ({ start_at, end_at }) => exhibitionPeriod(start_at, end_at),
    },
  },
})

export default PartnerShowEventType
