import moment from "moment-timezone"
import { GraphQLString, GraphQLFieldConfig, GraphQLNonNull } from "graphql"
import { ResolverContext } from "types/graphql"
import { snakeCase } from "lodash"

export const formatDate = (
  rawDate: string,
  format?: string | null,
  timezone?: string
) => {
  const isDateOnlyFormat = format && !format.match(/[Hh]|m|s|[Aa]|[zZ]/)

  if (timezone && format && !isDateOnlyFormat) {
    return moment.utc(rawDate).tz(timezone).format(format)
  }

  if (timezone && !format) {
    return moment.utc(rawDate).tz(timezone).format()
  }

  if (format) {
    return moment.utc(rawDate).format(format)
  }

  return rawDate
}

type Value = string | null | undefined

export const date = <T>(
  fn?: (response: T) => Value,
  nonNull?: boolean
): GraphQLFieldConfig<T, ResolverContext> => {
  return {
    type: nonNull ? new GraphQLNonNull(GraphQLString) : GraphQLString,
    args: {
      format: { type: GraphQLString },
      timezone: {
        type: GraphQLString,
        description:
          'A tz database time zone, otherwise falls back to "X-TIMEZONE" header. See http://www.iana.org/time-zones, https://en.wikipedia.org/wiki/List_of_tz_database_time_zones',
      },
    },
    resolve: (
      obj,
      { format, timezone },
      { defaultTimezone },
      { fieldName }
    ) => {
      const value: Value = fn
        ? fn(obj)
        : obj[snakeCase(fieldName)] ?? obj[fieldName]

      if (!value) {
        return null
      }

      const timezoneString = timezone ? timezone : defaultTimezone

      return formatDate(value, format, timezoneString)
    },
  }
}

/**
 * @deprecated: Use the type-safe date function
 */
const dateField = date()

export default dateField
