import { GraphQLFieldConfig, GraphQLObjectType, GraphQLString } from "graphql"
import { OrderJSON } from "./exchangeJson"
import { ResolverContext } from "types/graphql"

const DeliveryInfoType = new GraphQLObjectType({
  name: "DeliveryInfo",
  description: "Shipment details for an order",
  fields: () => ({
    shipperName: {
      type: GraphQLString,
      description:
        "The carrier handling the shipment as saved on the order (e.g., UPS, FedEx, DHL, USPS)",
    },
    trackingNumber: {
      type: GraphQLString,
      description: "The tracking number for the shipment",
    },
    trackingURL: {
      type: GraphQLString,
      description: "The URL to track the shipment",
    },

    estimatedDelivery: {
      type: GraphQLString,
      description: "Estimated delivery date saved on the order as date stringr",
    },

    estimatedDeliveryWindow: {
      type: GraphQLString,
      description:
        "Estimated delivery window saved on the otder as display text",
    },
  }),
})

export const DeliveryInfo: GraphQLFieldConfig<OrderJSON, ResolverContext> = {
  type: DeliveryInfoType,
  description: "Details about the shipment of an order",
  resolve: (order: OrderJSON) => {
    return resolveDeliveryInfo(order)
  },
}

const resolveDeliveryInfo = (order: OrderJSON) => {
  if (!order.delivery_info) {
    return null
  }

  const {
    shipper_name,
    tracking_url,
    tracking_id,
    estimated_delivery,
    estimated_delivery_window,
  } = order.delivery_info

  return {
    shipperName: shipper_name,
    trackingNumber: tracking_id,
    trackingURL: tracking_url,
    estimatedDelivery: estimated_delivery,
    estimatedDeliveryWindow: estimated_delivery_window,
  }
}
