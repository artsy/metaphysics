import dateField from "./fields/date"
import { GraphQLString, GraphQLObjectType } from "graphql"
import { ResolverContext } from "types/graphql"
import { dateRange, dateTimeRange } from "lib/date"

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
