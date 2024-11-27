import { GraphQLInputObjectType, GraphQLString } from "graphql"

export const ViewingRoomInputAttributesType = new GraphQLInputObjectType({
  name: "ViewingRoomAttributes",
  fields: {
    body: {
      type: GraphQLString,
    },
    endAt: {
      type: GraphQLString,
      description: "Datetime (in UTC) when Viewing Room closes",
    },
    introStatement: {
      type: GraphQLString,
    },
    pullQuote: {
      type: GraphQLString,
    },
    startAt: {
      type: GraphQLString,
      description: "Datetime (in UTC) when Viewing Room opens",
    },
    timeZone: {
      type: GraphQLString,
      description:
        "Time zone (tz database format, e.g. America/New_York) in which start_at/end_at attributes were input",
    },
    title: {
      type: GraphQLString,
      description: "Title",
    },
  },
})
