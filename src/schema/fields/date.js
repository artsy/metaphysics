import moment from "moment"
import "moment-timezone"
import { GraphQLString, GraphQLBoolean } from "graphql"

export function date(rawDate, format, timezone) {
  if (timezone) {
    if (format) {
      return moment(rawDate)
        .tz(timezone)
        .format(format)
    }
    return moment(rawDate)
      .tz(timezone)
      .format()
  }
  if (format) return moment.utc(rawDate).format(format)
  return rawDate
}

export default {
  type: GraphQLString,
  args: {
    convert_to_utc: {
      type: GraphQLBoolean,
      deprecationReason: "Use timezone instead",
    },
    format: {
      type: GraphQLString,
    },
    // Accepts a tz database timezone string. See http://www.iana.org/time-zones,
    // https://en.wikipedia.org/wiki/List_of_tz_database_time_zones
    timezone: {
      type: GraphQLString,
      description: "Specify a tz database time zone, otherwise falls back to `X-TIMEZONE` header",
    },
  },
  resolve: (obj, { format, timezone }, request, { fieldName, rootValue: { defaultTimezone } }) => {
    const rawDate = obj[fieldName]
    const timezoneString = timezone || defaultTimezone
    return date(rawDate, format, timezoneString)
  },
}
