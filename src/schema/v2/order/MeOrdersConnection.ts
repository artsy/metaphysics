import {
  connectionWithCursorInfo,
  paginationResolver,
} from "schema/v2/fields/pagination"
import { convertConnectionArgsToGravityArgs } from "lib/helpers"
import { OrderType } from "./types/OrderType"
import { pageable } from "relay-cursor-paging"
import {
  GraphQLEnumType,
  GraphQLFieldConfig,
  GraphQLInt,
  GraphQLList,
  GraphQLString,
} from "graphql"
import { ResolverContext } from "types/graphql"

export const MeOrdersConnectionType = connectionWithCursorInfo({
  name: "MeOrders",
  nodeType: OrderType,
}).connectionType

export const MeOrderBuyerStateEnum = new GraphQLEnumType({
  name: "MeOrderBuyerStateEnum",
  values: {
    INCOMPLETE: {
      value: "INCOMPLETE",
      description: "Order is incomplete (pending or abandoned)",
    },
    SUBMITTED: { value: "SUBMITTED", description: "Order has been submitted" },
    APPROVED: { value: "APPROVED", description: "Order has been approved" },
    OFFER_RECEIVED: {
      value: "OFFER_RECEIVED",
      description: "Order is an offer awaiting response from the buyer",
    },
    PAYMENT_FAILED: {
      value: "PAYMENT_FAILED",
      description: "Payment has failed",
    },
    PROCESSING_PAYMENT: {
      value: "PROCESSING_PAYMENT",
      description: "Payment is processing",
    },
    PROCESSING_OFFLINE_PAYMENT: {
      value: "PROCESSING_OFFLINE_PAYMENT",
      description: "Processing offline payment",
    },
    ACTION_REQUIRED: {
      value: "ACTION_REQUIRED",
      description: "Action required from buyer",
    },
    IN_TRANSIT: { value: "IN_TRANSIT", description: "Order is in transit" },
    SHIPPED: { value: "SHIPPED", description: "Order has been shipped" },
    PURCHASED: {
      value: "PURCHASED",
      description: "Order has been successfully purchased",
    },
    COMPLETED: { value: "COMPLETED", description: "Order is completed" },
    REFUNDED: { value: "REFUNDED", description: "Order has been refunded" },
    DECLINED_BY_SELLER: {
      value: "DECLINED_BY_SELLER",
      description: "Order was declined by the seller",
    },
    DECLINED_BY_BUYER: {
      value: "DECLINED_BY_BUYER",
      description: "Order was declined by the buyer",
    },
    CANCELLED: { value: "CANCELLED", description: "Order has been cancelled" },
    CANCELED: { value: "CANCELED", description: "Order has been canceled" },
  },
})

export const MeOrdersConnection: GraphQLFieldConfig<any, ResolverContext> = {
  type: MeOrdersConnectionType,
  args: pageable({
    page: { type: GraphQLInt },
    size: { type: GraphQLInt },
    artworkID: {
      type: GraphQLString,
      description: "Filter by artwork ID in line items",
    },
    editionSetID: {
      type: GraphQLString,
      description: "Filter by edition set ID in line items",
    },
    buyerState: {
      type: new GraphQLList(MeOrderBuyerStateEnum),
      description: "Filter by buyer states",
    },
  }),
  resolve: async (_parent, args, context, _info) => {
    const { meOrdersLoader } = context
    if (!meOrdersLoader) return null

    const { page, size, offset } = convertConnectionArgsToGravityArgs(args)

    const params: Record<string, any> = {
      page,
      size,
    }

    if (args.artworkID) {
      params.artwork_id = args.artworkID
    }

    if (args.editionSetID) {
      params.edition_set_id = args.editionSetID
    }

    if (args.buyerState && args.buyerState.length > 0) {
      params.buyer_state = args.buyerState.join(",")
    }

    const { body, headers } = await meOrdersLoader(params)
    const totalCount = parseInt((headers ?? {})["x-total-count"] || "0", 10)

    return paginationResolver({
      totalCount,
      offset,
      page,
      size,
      body,
      args,
    })
  },
}
