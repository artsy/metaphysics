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
              {return gravity("system/ping").then(
                ({ body: { ping } }) => {return ping === "pong"}
              )},
          },
        },
      }),
      resolve: () => {return {}},
    },
    ping: {
      type: GraphQLBoolean,
      description: "Metaphysics ping",
      resolve: () => {return true},
    },
  },
})

const Status = {
  type: StatusType,
  resolve: () => {return {}},
}

export default Status
