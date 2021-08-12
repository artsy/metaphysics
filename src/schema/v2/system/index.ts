import { GraphQLObjectType, GraphQLFieldConfig } from "graphql"

import Algolia from "./algolia"
import CausalityJWT from "./causality_jwt"
import SystemTime from "./time"
import Services from "./services"
import { ResolverContext } from "types/graphql"

const SystemType = new GraphQLObjectType<any, ResolverContext>({
  name: "System",
  fields: {
    algolia: Algolia,
    services: Services,
    time: SystemTime,
    causalityJWT: CausalityJWT,
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
