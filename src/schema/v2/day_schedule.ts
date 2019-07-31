import { GraphQLInt, GraphQLString, GraphQLObjectType } from "graphql"
import { ResolverContext } from "types/graphql"

const DayScheduleType = new GraphQLObjectType<any, ResolverContext>({
  name: "DaySchedule",
  fields: {
    startTime: {
      type: GraphQLInt,
      resolve: ({ start_time }) => start_time,
    },
    endTime: {
      type: GraphQLInt,
      resolve: ({ end_time }) => end_time,
    },
    dayOfWeek: {
      type: GraphQLString,
      resolve: ({ day_of_week }) => day_of_week,
    },
  },
})

export default DayScheduleType
