import dateField from "./fields/date"
import { GraphQLString, GraphQLObjectType } from "graphql"
import { ResolverContext } from "types/graphql"
import { dateRange, dateTimeRange } from "lib/date"
import { ExhibitionPeriodFormatEnum } from "./types/exhibitonPeriod"

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
    startAt: dateField,
    endAt: dateField,
    dateTimeRange: {
      type: GraphQLString,
      description: "A formatted description of the dates with hours",
      resolve: ({ start_at, end_at }, { timezone }, { defaultTimezone }) => {
        const timezoneString = timezone ? timezone : defaultTimezone
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
          defaultValue: ExhibitionPeriodFormatEnum.getValue("LONG"),
        },
      },
      resolve: ({ start_at, end_at }, args) => {
        const { format } = args
        return dateRange(start_at, end_at, "UTC", format)
      },
    },
  },
})

export default ShowEventType
