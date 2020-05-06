import { GraphQLObjectType, GraphQLString } from "graphql"
import { connectionDefinitions } from "graphql-relay"
import date from "schema/v1/fields/date"
import { ResolverContext } from "types/graphql"
import { InternalIDFields } from "schema/v1/object_identification"

export const OrderFulfillmentType = new GraphQLObjectType<any, ResolverContext>(
  {
    name: "OrderFulfillment",
    fields: () => ({
      ...InternalIDFields,
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
  nodeIsNonNullable: true,
  nodeType: OrderFulfillmentType,
})
