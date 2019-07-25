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
      utc_offset: { type: GraphQLInt },
      zone: { type: GraphQLString },
      iso8601: { type: GraphQLString },
    }
  },
})

const SystemTime: GraphQLFieldConfig<any, ResolverContext> = {
  type: SystemTimeType,
  description:
    "Gravity system time, necessary for synchronizing device clocks.",
  resolve: (_root, _options, { systemTimeLoader }) => {
    return systemTimeLoader()
  },
}

export default SystemTime
