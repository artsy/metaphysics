import { GraphQLObjectType } from "graphql"

import SystemTime from "./time"

const SystemType = new GraphQLObjectType({
  name: "System",
  fields: {
    time: SystemTime,
  },
})

const System = {
  type: SystemType,
  description: "Fields related to internal systems.",
  resolve: () => {
    // dummy response object, otherwise the nested fields won’t work
    return {}
  },
}

export default System
