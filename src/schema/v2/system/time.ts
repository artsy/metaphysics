import {
  GraphQLString,
  GraphQLBoolean,
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
      dst: { type: GraphQLBoolean },
      unix: { type: GraphQLInt },
      utcOffset: {
        type: GraphQLInt,
        resolve: ({ utc_offset }) => utc_offset,
      },
      zone: { type: GraphQLString },
      iso8601: { type: GraphQLString },
    }
  },
})

const SystemTime: GraphQLFieldConfig<any, ResolverContext> = {
  type: SystemTimeType,
  description: "Core system time, necessary for synchronizing device clocks.",
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
      dst: false, // TODO
      unix: Math.floor(now.getTime() / 1000),
      utcOffset: now.getTimezoneOffset() * -60,
      zone: now
        .toLocaleString("en", { timeZoneName: "short" })
        .split(" ")
        .pop(),
      iso8601: now.toISOString(),
    }
  },
}

export default SystemTime
