import {
  GraphQLInterfaceType,
  GraphQLID,
  GraphQLString,
  GraphQLInt,
  GraphQLFloat,
} from "graphql"
import { OrderModeEnum } from "./order_mode_enum"
import { RequestedFulfillmentUnionType } from "./requested_fulfillment_union_type"
import { OfferType, OfferConnection } from "./offer"
import { amount } from "schema/fields/money"
import { OrderLineItemConnection } from "./order_line_item"
import { OrderPartyUnionType } from "./order_party_union"
import { resolveOrderParty } from "./order"
import { CreditCard } from "schema/credit_card"
import { date } from "schema/fields/date"

export const OrderInterface = new GraphQLInterfaceType({
  name: "OrderInterface",
  fields: () => ({
    id: {
      type: GraphQLID,
      description: "ID of the order",
    },
    mode: {
      type: OrderModeEnum,
      description: "Order Mode",
    },
    currencyCode: {
      type: GraphQLString,
      description: "Currency code of this order",
    },
    state: {
      type: GraphQLString,
      description: "State of the order",
    },
    stateReason: {
      type: GraphQLString,
      description: "Reason for current state",
    },
    code: {
      type: GraphQLString,
      description: "Tracking code of the order",
    },
    requestedFulfillment: {
      type: RequestedFulfillmentUnionType,
      description: "Order Requested Fulfillment",
    },
    lastOffer: {
      type: OfferType,
      description: "Latest offer",
    },
    offers: {
      type: OfferConnection,
      description: "List of offers made on this order so far",
    },
    itemsTotalCents: {
      type: GraphQLInt,
      description: "Item total in cents",
    },
    itemsTotal: amount(({ itemsTotalCents }) => itemsTotalCents),
    totalListPriceCents: {
      type: GraphQLInt,
      description: "Total list price in cents",
    },
    totalListPrice: amount(({ totalListPriceCents }) => totalListPriceCents),
    shippingTotalCents: {
      type: GraphQLInt,
      description: "Shipping total in cents",
    },
    offerTotalCents: {
      type: GraphQLInt,
      description: "Total amount of latest offer",
      deprecationReason: "Switch to ItemTotalCents",
      resolve: ({ itemsTotalCents }) => itemsTotalCents,
    },
    offerTotal: amount(({ itemsTotalCents }) => itemsTotalCents),
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
    commissionRate: {
      type: GraphQLFloat,
      description: "Partner commission rate used to calculate commission fee",
    },
    displayCommissionRate: {
      type: GraphQLString,
      description: "Partner commission rate formatted into percentage",
    },
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
    lastApprovedAt: date,
    lastSubmittedAt: date,
    updatedAt: date,
    createdAt: date,
    stateUpdatedAt: date,
    stateExpiresAt: date,
    buyerPhoneNumber: {
      type: GraphQLString,
      description: "Buyer phone number",
    },
  }),
})
