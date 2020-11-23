import gravity from "lib/apis/gravity" // Uncached
import { GraphQLObjectType, GraphQLBoolean, GraphQLFieldConfig } from "graphql"
import { ResolverContext } from "types/graphql"

const StatusType = new GraphQLObjectType<any, ResolverContext>({
  name: "Status",
  fields: {
    gravity: {
      type: new GraphQLObjectType<any, ResolverContext>({
        name: "StatusGravity",
        description: "Gravity ping",
        fields: {
          ping: {
            type: GraphQLBoolean,
            resolve: () =>
              gravity("system/ping").then(
                ({ body: { ping } }) => ping === "pong"
              ),
          },
        },
      }),
      resolve: () => ({}),
    },
    ping: {
      type: GraphQLBoolean,
      description: "Metaphysics ping",
      resolve: () => true,
    },
  },
})

const Status: GraphQLFieldConfig<void, ResolverContext> = {
  type: StatusType,
  resolve: () => ({}),
}

export default Status
