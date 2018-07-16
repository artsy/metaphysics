import { GraphQLID, GraphQLObjectType, GraphQLString } from "graphql"
import { connectionDefinitions } from "graphql-relay"

import Partner from "schema/partner"
import { amount } from "schema/fields/money"
import date from "schema/fields/date"
import { UserByID } from "schema/user"
import { OrderLineItemConnection } from "./order_line_item"

export const OrderType = new GraphQLObjectType({
  name: "Order",
  fields: () => ({
    id: {
      type: GraphQLID,
      description: "ID of the order",
    },
    currencyCode: {
      type: GraphQLString,
      description: "Currency code of this order",
    },
    state: {
      type: GraphQLString,
      description: "State of the order",
    },
    code: {
      type: GraphQLString,
      description: "Tracking code of the order",
    },
    itemsTotalCents: amount(({ itemsTotalCents }) => itemsTotalCents),
    shippingTotalCents: amount(({ shippingTotalCents }) => shippingTotalCents),
    taxTotalCents: amount(({ taxTotalCents }) => taxTotalCents),
    transactionFeeCents: amount(
      ({ transactionFeeCents }) => transactionFeeCents
    ),
    commissionFeeCents: amount(({ commissionFeeCents }) => commissionFeeCents),
    subtotalCents: amount(({ subtotalCents }) => subtotalCents),
    totalCents: amount(({ totalCents }) => totalCents),
    lineItems: {
      type: OrderLineItemConnection,
      description: "List of order line items",
    },
    partner: {
      type: Partner.type,
      description: "Partner of this order",
      resolve: (
        { partnerId },
        _args,
        _context,
        { rootValue: { partnerLoader } }
      ) => partnerLoader(partnerId),
    },
    user: {
      type: UserByID.type,
      description: "User of this order",
      resolve: (
        { userId },
        _args,
        _context,
        { rootValue: { userByIDLoader } }
      ) => (userId ? userByIDLoader(userId) : null),
    },
    updatedAt: date,
    createdAt: date,
    stateUpdatedAt: date,
    stateExpiresAt: date,
  }),
})

export const {
  connectionType: OrderConnection,
  edgeType: OrderEdge,
} = connectionDefinitions({
  nodeType: OrderType,
})
