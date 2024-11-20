import {
  GraphQLString,
  GraphQLInt,
  GraphQLObjectType,
  GraphQLFieldConfig,
} from "graphql"
import { ResolverContext } from "types/graphql"

const SystemTimeType = new GraphQLObjectType<any, ResolverContext>({
  name: "SystemTime",
  fields: () => {
    return {
      day: { type: GraphQLInt },
      wday: { type: GraphQLInt },
      month: { type: GraphQLInt },
      year: { type: GraphQLInt },
      hour: { type: GraphQLInt },
      min: { type: GraphQLInt },
      sec: { type: GraphQLInt },
      unix: { type: GraphQLInt },
      iso8601: { type: GraphQLString },
    }
  },
})

const SystemTime: GraphQLFieldConfig<any, ResolverContext> = {
  type: SystemTimeType,
  description: "Core system time, helpful for reliable times on clients.",
  resolve: () => {
    const now = new Date()
    return {
      day: now.getDate(),
      wday: now.getDay(),
      month: now.getMonth() + 1, // convert from 0-indexed to 1-indexed
      year: now.getFullYear(),
      hour: now.getHours(),
      min: now.getMinutes(),
      sec: now.getSeconds(),
      unix: Math.floor(now.getTime() / 1000),
      iso8601: now.toISOString(),
    }
  },
}

export default SystemTime
