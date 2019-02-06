import gravity from "lib/apis/gravity" // Uncached
import { GraphQLObjectType, GraphQLBoolean } from "graphql"

const StatusType = new GraphQLObjectType<ResolverContext>({
  name: "Status",
  fields: {
    gravity: {
      type: new GraphQLObjectType<ResolverContext>({
        name: "StatusGravity",
        description: "Gravity ping",
        fields: {
          ping: {
            type: GraphQLBoolean,
            resolve: () =>
              // FIXME:  Expected 2-3 arguments, but got 1.
              // @ts-ignore
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

const Status = {
  type: StatusType,
  resolve: () => ({}),
}

export default Status
