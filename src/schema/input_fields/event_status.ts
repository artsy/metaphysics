import { GraphQLEnumType } from "graphql"

const EventStatus = {
  type: new GraphQLEnumType({
    name: "EventStatus",
    values: {
      closed: {
        value: "closed",
        deprecationReason: "use capital enums",
      },
      current: {
        value: "current",
        deprecationReason: "use capital enums",
      },
      running: {
        value: "running",
        deprecationReason: "use capital enums",
      },
      upcoming: {
        value: "upcoming",
        deprecationReason: "use capital enums",
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
    },
  }),
}

export default EventStatus
