import date from "./fields/date"
import { GraphQLString, GraphQLObjectType } from "graphql"
import { ResolverContext } from "types/graphql"
import { exhibitionPeriod } from "lib/date"

const PartnerShowEventType = new GraphQLObjectType<any, ResolverContext>({
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
    exhibitionPeriod: {
      type: GraphQLString,
      description: "A formatted description of the start to end dates",
      resolve: ({ start_at, end_at }) => exhibitionPeriod(start_at, end_at),
    },
  },
})

export default PartnerShowEventType
