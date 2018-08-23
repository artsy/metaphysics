import {
  GraphQLID,
  GraphQLObjectType,
  GraphQLString,
  GraphQLInt,
} from "graphql"
import { OrderFulfillmentTypeEnum } from "./order_fulfillment_type_enum"
import { connectionDefinitions } from "graphql-relay"

import Partner from "schema/partner"
import { amount } from "schema/fields/money"
import date from "schema/fields/date"
import { UserByID } from "schema/user"
import { CreditCard } from "schema/credit_card"
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
    fulfillmentType: {
      type: OrderFulfillmentTypeEnum,
      description: "Fulfillment Type",
    },
    shippingName: {
      type: GraphQLString,
      description: "Name for shipping information",
    },
    shippingAddressLine1: {
      type: GraphQLString,
      description: "Shipping address line 1",
    },
    shippingAddressLine2: {
      type: GraphQLString,
      description: "Shipping address line 2",
    },
    shippingCity: {
      type: GraphQLString,
      description: "Shipping city",
    },
    shippingCountry: {
      type: GraphQLString,
      description: "Shipping country",
    },
    shippingPostalCode: {
      type: GraphQLString,
      description: "Shipping postal code",
    },
    shippingRegion: {
      type: GraphQLString,
      description: "Shipping region",
    },
    itemsTotalCents: {
      type: GraphQLInt,
      description: "Item total in cents",
    },
    itemsTotal: amount(({ itemsTotalCents }) => itemsTotalCents),
    shippingTotalCents: {
      type: GraphQLInt,
      description: "Shipping total in cents",
    },
    shippingTotal: amount(({ shippingTotalCents }) => shippingTotalCents),
    taxTotalCents: {
      type: GraphQLInt,
      description: "Tax total in cents",
    },
    taxTotal: amount(({ taxTotalCents }) => taxTotalCents),
    transactionFeeCents: {
      type: GraphQLInt,
      description: "Transaction fee in cents",
    },
    transactionFee: amount(({ transactionFeeCents }) => transactionFeeCents),
    commissionFeeCents: {
      type: GraphQLInt,
      description: "Commission fee in cents",
    },
    commissionFee: amount(({ commissionFeeCents }) => commissionFeeCents),
    buyerTotalCents: {
      type: GraphQLInt,
      description: "Buyer total in cents",
    },
    buyerTotal: amount(({ buyerTotalCents }) => buyerTotalCents),
    sellerTotalCents: {
      type: GraphQLInt,
      description: "Seller total in cents",
    },
    sellerTotal: amount(({ sellerTotalCents }) => sellerTotalCents),
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
    creditCard: {
      type: CreditCard.type,
      description: "Credit card on this order",
      resolve: (
        { creditCardId },
        _args,
        _context,
        { rootValue: { creditCardLoader } }
      ) => (creditCardId ? creditCardLoader(creditCardId) : null),
    },
    // TODO: The `date` resolver not typed correctly
    updatedAt: date as any,
    createdAt: date as any,
    stateUpdatedAt: date as any,
    stateExpiresAt: date as any,
  }),
})

export const {
  connectionType: OrderConnection,
  edgeType: OrderEdge,
} = connectionDefinitions({
  nodeType: OrderType,
})
