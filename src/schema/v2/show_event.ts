import dateField from "./fields/date"
import { GraphQLString, GraphQLObjectType } from "graphql"
import { ResolverContext } from "types/graphql"
import { dateRange, dateTimeRange } from "lib/date"
import { ExhibitionPeriodFormatEnum } from "./types/exhibitonPeriod"
import { connectionWithCursorInfo } from "./fields/pagination"
import { GravityIDFields } from "./object_identification"
import moment from "moment-timezone"

export const formatTimeZone = (timeZone: string) => {
  // Get current offset in hours for the given timezone
  const offset = moment.tz(timeZone).format("Z")
  // Extract a user-friendly name
  const displayName = timeZone.split("/")[1].replace("_", " ")
  return `(GMT${offset}) ${displayName}`
}

const ShowEventType = new GraphQLObjectType<any, ResolverContext>({
  name: "ShowEventType",
  fields: {
    ...GravityIDFields,
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
    startAt: dateField,
    endAt: dateField,
    dateTimeRange: {
      type: GraphQLString,
      description: "A formatted description of the dates with hours",
      resolve: ({ start_at, end_at, time_zone }, { defaultTimezone }) => {
        const timezoneString = time_zone ? time_zone : defaultTimezone
        return dateTimeRange(start_at, end_at, timezoneString, true)
      },
    },
    exhibitionPeriod: {
      type: GraphQLString,
      description: "A formatted description of the start to end dates",
      args: {
        format: {
          type: ExhibitionPeriodFormatEnum,
          description: "Formatting option to apply to exhibition period",
          defaultValue: ExhibitionPeriodFormatEnum.getValue("LONG")?.value,
        },
      },
      resolve: ({ start_at, end_at }, args) => {
        const { format } = args
        return dateRange(start_at, end_at, "UTC", format)
      },
    },
    formattedTimeZone: {
      type: GraphQLString,
      description: "A formatted description of the time zone",
      resolve: ({ time_zone }) => {
        if (!time_zone) return null

        return formatTimeZone(time_zone)
      },
    },
    timeZone: {
      type: GraphQLString,
      resolve: ({ time_zone }) => time_zone,
    },
  },
})

export const ShowEventConnectionType = connectionWithCursorInfo({
  name: "ShowEvent",
  nodeType: ShowEventType,
}).connectionType

export default ShowEventType
