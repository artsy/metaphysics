import gravity from "lib/apis/gravity" // Uncached
import { GraphQLObjectType, GraphQLBoolean } from "graphql"

const StatusType = new GraphQLObjectType({
  name: "Status",
  fields: {
    gravity: {
      type: new GraphQLObjectType({
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

const Status = {
  type: StatusType,
  resolve: () => ({}),
}

export default Status
