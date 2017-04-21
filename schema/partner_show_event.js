import date from "./fields/date"
import { GraphQLString, GraphQLObjectType } from "graphql"

const PartnerShowEventType = new GraphQLObjectType({
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
    start_at: date,
    end_at: date,
  },
})

export default PartnerShowEventType
