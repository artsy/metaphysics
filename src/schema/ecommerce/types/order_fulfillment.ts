import { GraphQLID, GraphQLObjectType, GraphQLString } from "graphql"
import { connectionDefinitions } from "graphql-relay"
import date from "schema/fields/date"
import { ResolverContext } from "types/graphql"

export const OrderFulfillmentType = new GraphQLObjectType<any, ResolverContext>(
  {
    name: "OrderFulfillment",
    fields: () => ({
      id: {
        type: GraphQLID,
        description: "ID of the fulfillment",
      },
      courier: {
        type: GraphQLString,
        description: "Fulfillment Courier",
      },
      trackingId: {
        type: GraphQLString,
        description: "Courier's tracking id",
      },
      estimatedDelivery: date,
    }),
  }
)

export const {
  connectionType: OrderFulfillmentConnection,
  edgeType: OrderFulfillmentEdge,
} = connectionDefinitions({
  nodeType: OrderFulfillmentType,
})
