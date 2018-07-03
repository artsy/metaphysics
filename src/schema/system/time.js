import gravity from "lib/apis/gravity" // Uncached

import { loaderOneOffFactory } from "lib/loaders/api/loader_one_off_factory"

import {
  GraphQLString,
  GraphQLBoolean,
  GraphQLInt,
  GraphQLObjectType,
} from "graphql"

const SystemTimeType = new GraphQLObjectType({
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
      utc_offset: { type: GraphQLInt },
      zone: { type: GraphQLString },
      iso8601: { type: GraphQLString },
    }
  },
})

const SystemTime = {
  type: SystemTimeType,
  description:
    "Gravity system time, necessary for synchronizing device clocks.",
  resolve: async () => {
    try {
      const result = await loaderOneOffFactory(
        gravity,
        "gravity",
        "system/time"
      )
      return result
    } catch (e) {
      console.error("system/time error", e)
    }
  },
}

export default SystemTime
