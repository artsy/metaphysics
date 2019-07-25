import { GraphQLObjectType, GraphQLFieldConfig } from "graphql"

import SystemTime from "./time"
import { ResolverContext } from "types/graphql"

const SystemType = new GraphQLObjectType<any, ResolverContext>({
  name: "System",
  fields: {
    time: SystemTime,
  },
})

const System: GraphQLFieldConfig<void, ResolverContext> = {
  type: SystemType,
  description: "Fields related to internal systems.",
  resolve: () => {
    // dummy response object, otherwise the nested fields won’t work
    return {}
  },
}

export default System
