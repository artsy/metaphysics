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
      },
      CURRENT: {
        value: "current",
      },
      RUNNING: {
        value: "running",
      },
      UPCOMING: {
        value: "upcoming",
      },
    },
  }),
}

export default EventStatus
