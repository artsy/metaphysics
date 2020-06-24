import moment from "moment"
import "moment-timezone"
import { GraphQLString, GraphQLFieldConfig } from "graphql"
import { ResolverContext } from "types/graphql"
import { snakeCase } from "lodash"

export function date(rawDate, format, timezone) {
  if (timezone) {
    if (format) {
      return moment(rawDate).tz(timezone).format(format)
    }
    return moment(rawDate).tz(timezone).format()
  }
  if (format) return moment.utc(rawDate).format(format)
  return rawDate
}

export interface DateSource {
  format: string
  timezone: string
}

const dateField: GraphQLFieldConfig<DateSource, ResolverContext> = {
  type: GraphQLString,
  args: {
    format: {
      type: GraphQLString,
    },
    // Accepts a tz database timezone string. See http://www.iana.org/time-zones,
    // https://en.wikipedia.org/wiki/List_of_tz_database_time_zones
    timezone: {
      type: GraphQLString,
      description:
        "A tz database time zone, otherwise falls back to `X-TIMEZONE` header",
    },
  },
  resolve: (obj, { format, timezone }, { defaultTimezone }, { fieldName }) => {
    const rawDate = obj[fieldName] || obj[snakeCase(fieldName)]
    if (!rawDate) {
      return null
    }
    const timezoneString = timezone ? timezone : defaultTimezone
    return date(rawDate, format, timezoneString)
  },
}

export default dateField
