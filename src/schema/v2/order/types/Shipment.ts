import { GraphQLFieldConfig, GraphQLObjectType, GraphQLString } from "graphql"
import {
  getTracking,
  TrackingNumber,
  ups,
  fedex,
  dhl,
  usps,
} from "ts-tracking-number"
import { OrderJSON } from "./exchangeJson"
import { ResolverContext } from "types/graphql"

const ShipmentType = new GraphQLObjectType({
  name: "Shipment",
  description: "Shipment details for an order",
  fields: () => ({
    trackingNumber: {
      type: GraphQLString,
      description: "The tracking number for the shipment",
    },
    trackingURL: {
      type: GraphQLString,
      description: "The URL to track the shipment",
    },
    courier: {
      type: GraphQLString,
      description:
        "The carrier handling the shipment (e.g., UPS, FedEx, DHL, USPS)",
    },
  }),
})

export const Shipment: GraphQLFieldConfig<OrderJSON, ResolverContext> = {
  type: ShipmentType,
  description: "Details about the shipment of an order",
  resolve: (order: OrderJSON) => {
    return resolveShipment(order)
  },
}

const resolveShipment = (order: OrderJSON) => {
  if (!order.shipment) {
    return null
  }

  const { tracking_id: trackingNumber, courier } = order.shipment
  let trackingURL: string | null

  const tracking = guessTracking(courier, trackingNumber)
  const urlTemplate = tracking?.trackingUrl

  if (urlTemplate && tracking.trackingNumber) {
    // If urlTemplate is present it is in the format https://tools.usps.com/go/TrackConfirmAction?tLabels=%s
    // so we just need to format that into place using
    trackingURL = urlTemplate.replace(
      "%s",
      encodeURIComponent(tracking.trackingNumber)
    )
  } else {
    trackingURL = order.shipment.tracking_url ?? null
  }

  return {
    courier,
    trackingNumber,
    trackingURL,
  }
}

const guessTracking = (
  courierRaw?: string,
  trackingNumber?: string
): TrackingNumber | null => {
  if (!trackingNumber) {
    return null
  }

  let tracking: TrackingNumber | undefined
  const normalizedCourier = courierRaw?.toLowerCase()

  if (normalizedCourier?.startsWith("ups")) {
    tracking = getTracking(trackingNumber, [ups])
  } else if (normalizedCourier?.startsWith("fedex")) {
    tracking = getTracking(trackingNumber, [fedex])
  } else if (normalizedCourier?.startsWith("dhl")) {
    tracking = getTracking(trackingNumber, [dhl])
  } else if (normalizedCourier?.startsWith("usps")) {
    tracking = getTracking(trackingNumber, [usps])
  } else {
    tracking = getTracking(trackingNumber)
  }

  if (!tracking) {
    return null
  }

  return tracking
}
