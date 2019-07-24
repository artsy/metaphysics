import { GraphQLEnumType } from "graphql"
import { deprecate } from "lib/deprecation"

const EventStatus = {
  type: new GraphQLEnumType({
    name: "EventStatus",
    values: {
      closed: {
        value: "closed",
        deprecationReason: deprecate({
          inVersion: 2,
          preferUsageOf: "CLOSED",
        }),
      },
      current: {
        value: "current",
        deprecationReason: deprecate({
          inVersion: 2,
          preferUsageOf: "CURRENT",
        }),
      },
      running: {
        value: "running",
        deprecationReason: deprecate({
          inVersion: 2,
          preferUsageOf: "RUNNING",
        }),
      },
      upcoming: {
        value: "upcoming",
        deprecationReason: deprecate({
          inVersion: 2,
          preferUsageOf: "UPCOMING",
        }),
      },
      CLOSED: {
        value: "closed",
        description: "End date is in the past",
      },
      CURRENT: {
        value: "current",
        description: "Start date or end date is in the future",
      },
      RUNNING: {
        value: "running",
        description: "Start date is in the past and end date is in the future",
      },
      UPCOMING: {
        value: "upcoming",
        description: "Start date is in the future",
      },
      CLOSING_SOON: {
        value: "closing_soon",
        description: "End date is in near future",
      },
      RUNNING_AND_UPCOMING: {
        value: "running_and_upcoming",
        description:
          "Special filtering option which is used to show running and upcoming shows",
      },
    },
  }),
}

export default EventStatus
