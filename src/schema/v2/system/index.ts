import {
  GraphQLObjectType,
  GraphQLFieldConfig,
  GraphQLNonNull,
  GraphQLString,
} from "graphql"
import CausalityJWT from "./causality_jwt"
import SystemTime from "./time"
import Services from "./services"
import { ResolverContext } from "types/graphql"
import { Algolia } from "../algolia"
import { UserRoles } from "./userRoles"

const SystemType = new GraphQLObjectType<any, ResolverContext>({
  name: "System",
  fields: {
    algolia: Algolia, // TODO: remove once older Android (<= 8.9.0 becomes negligible)
    services: Services,
    time: SystemTime,
    causalityJWT: CausalityJWT,
    request: {
      type: new GraphQLObjectType<any, ResolverContext>({
        name: "Request",
        fields: {
          ipAddress: {
            type: new GraphQLNonNull(GraphQLString),
            description:
              "IP Address of the current request, useful for debugging",
            resolve: (_root, _options, { ipAddress }) => ipAddress,
          },
        },
      }),
      resolve: () => ({}),
    },
    userRoles: UserRoles,
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
