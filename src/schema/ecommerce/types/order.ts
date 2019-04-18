import {
  GraphQLID,
  GraphQLObjectType,
  GraphQLString,
  GraphQLInt,
  GraphQLFloat,
  GraphQLInterfaceType,
  GraphQLFieldConfigMap,
  GraphQLBoolean,
} from "graphql"
import { connectionDefinitions } from "graphql-relay"

import { amount } from "schema/fields/money"
import date, { DateSource } from "schema/fields/date"
import { CreditCard } from "schema/credit_card"
import { OrderLineItemConnection } from "./order_line_item"
import { RequestedFulfillmentUnionType } from "./requested_fulfillment_union_type"
import { OrderPartyUnionType } from "./order_party_union"
import { OrderModeEnum } from "./enums/order_mode_enum"
import { OfferConnection, OfferType } from "./offer"
import { OrderParticipantEnum } from "./enums/order_participant_enum"
import { PageCursorsType } from "schema/fields/pagination"
import { ResolverContext } from "types/graphql"
import { InternalIDFields } from "schema/object_identification"

interface BuyerSource {
  __typename: "EcommerceUser"
  id: string
}

interface SellerSource {
  __typename: "EcommercePartner"
  id: string
}

interface OrderSource {
  buyer: BuyerSource
  seller: SellerSource
  creditCardId?: string
}

const orderFields: GraphQLFieldConfigMap<
  DateSource & OrderSource,
  ResolverContext
> = {
  ...InternalIDFields,
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
    description: "Uniq user-friendly code of the order",
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
  totalListPriceCents: {
    type: GraphQLInt,
    description: "Total list price in cents",
  },
  totalListPrice: amount(({ totalListPriceCents }) => totalListPriceCents),
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
    resolve: ({ seller }, _args, { userByIDLoader, partnerLoader }) =>
      resolveOrderParty(seller, userByIDLoader, partnerLoader),
  },
  buyer: {
    type: OrderPartyUnionType,
    description: "Buyer of this order",
    resolve: ({ buyer }, _args, { userByIDLoader, partnerLoader }) =>
      resolveOrderParty(buyer, userByIDLoader, partnerLoader),
  },
  creditCard: {
    type: CreditCard.type,
    description: "Credit card on this order",
    resolve: ({ creditCardId }, _args, { creditCardLoader }) =>
      creditCardId && creditCardLoader ? creditCardLoader(creditCardId) : null,
  },
  lastTransactionFailed: {
    type: GraphQLBoolean,
    description: "Whether or not the last attempt to charge the buyer failed",
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
}

export const OrderInterface = new GraphQLInterfaceType({
  name: "Order",
  resolveType: ({ mode }) => {
    if (mode === "BUY") return BuyOrderType
    else if (mode === "OFFER") return OfferOrderType
  },
  fields: () => orderFields,
})

export const OfferOrderType = new GraphQLObjectType<any, ResolverContext>({
  name: "OfferOrder",
  interfaces: () => [OrderInterface],
  fields: () => ({
    ...orderFields,
    myLastOffer: {
      type: OfferType,
      description: "Current User's latest offer",
    },
    awaitingResponseFrom: {
      type: OrderParticipantEnum,
      description: "Waiting for one participants response",
    },
    lastOffer: {
      type: OfferType,
      description: "Latest offer",
    },
    offers: {
      type: OfferConnection,
      description: "List of submitted offers made on this order so far",
    },
  }),
  isTypeOf: () => true,
})

export const BuyOrderType = new GraphQLObjectType<any, ResolverContext>({
  name: "BuyOrder",
  interfaces: () => [OrderInterface],
  fields: orderFields,
  isTypeOf: () => true,
})

export const resolveOrderParty = async (
  orderParty: BuyerSource | SellerSource,
  userByIDLoader,
  partnerLoader
) => {
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
  nodeType: OrderInterface,
  connectionFields: {
    totalCount: {
      type: GraphQLInt,
    },
    totalPages: {
      type: GraphQLInt,
    },
    pageCursors: {
      type: PageCursorsType,
      resolve: ({ pageCursors }) => pageCursors,
    },
  },
})
