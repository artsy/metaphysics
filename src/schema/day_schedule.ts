import { GraphQLInt, GraphQLString, GraphQLObjectType } from "graphql"

const DayScheduleType = new GraphQLObjectType<ResolverContext>({
  name: "DaySchedule",
  fields: {
    start_time: {
      type: GraphQLInt,
    },
    end_time: {
      type: GraphQLInt,
    },
    day_of_week: {
      type: GraphQLString,
    },
  },
})

export default DayScheduleType
