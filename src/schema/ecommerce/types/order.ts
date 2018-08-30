import {
  GraphQLID,
  GraphQLObjectType,
  GraphQLString,
  GraphQLInt,
} from "graphql"
import { connectionDefinitions } from "graphql-relay"

import { amount } from "schema/fields/money"
import date from "schema/fields/date"
import { CreditCard } from "schema/credit_card"
import { OrderLineItemConnection } from "./order_line_item"
import { RequestedFulfillmentUnionType } from "./requested_fulfillment_union_type"
import { OrderPartyUnionType } from "./order_party_union"

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
    requestedFulfillment: {
      type: RequestedFulfillmentUnionType,
      description: "Order Requested Fulfillment",
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
    seller: {
      type: OrderPartyUnionType,
      description: "Seller of this order",
      resolve: (
        { seller },
        _args,
        _context,
        { rootValue: { userByIDLoader, partnerLoader } }
      ) => resolveOrderParty(seller, userByIDLoader, partnerLoader),
    },
    buyer: {
      type: OrderPartyUnionType,
      description: "Buyer of this order",
      resolve: (
        { buyer },
        _args,
        _context,
        { rootValue: { userByIDLoader, partnerLoader } }
      ) => resolveOrderParty(buyer, userByIDLoader, partnerLoader),
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
    lastApprovedAt: date as any,
    lastSubmittedAt: date as any,
    updatedAt: date as any,
    createdAt: date as any,
    stateUpdatedAt: date as any,
    stateExpiresAt: date as any,
  }),
})

const resolveOrderParty = async (orderParty, userByIDLoader, partnerLoader) => {
  if (orderParty.id) {
    if (orderParty.__typename === "EcommerceUser") {
      const user = await userByIDLoader(orderParty.id)
      user.__typename = "User"
      return user
    } else if (orderParty.__typename === "EcommercePartner") {
      const partner = await partnerLoader(orderParty.id)
      partner.__typename = "Partner"
      return partner
    }
  } else {
    return null
  }
}

export const {
  connectionType: OrderConnection,
  edgeType: OrderEdge,
} = connectionDefinitions({
  nodeType: OrderType,
  connectionFields: {
    totalCount: {
      type: GraphQLInt,
      resolve: ({ totalCount }) => totalCount,
    },
  },
})
