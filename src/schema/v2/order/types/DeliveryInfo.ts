import {
  GraphQLEnumType,
  GraphQLFieldConfig,
  GraphQLObjectType,
  GraphQLString,
} from "graphql"
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

const ShipperCodeType = new GraphQLEnumType({
  name: "ShipperCode",
  description: "Enum for different courier codes",
  values: {
    UPS: {
      value: "UPS",
      description: "United Parcel Service",
    },
    FEDEX: {
      value: "FEDEX",
      description: "Federal Express",
    },
    DHL: {
      value: "DHL",
      description: "DHL Express",
    },
    USPS: {
      value: "USPS",
      description: "United States Postal Service",
    },
    OTHER: {
      value: "OTHER",
      description: "Other courier not listed - see shipperName",
    },
  },
})

const DeliveryInfoType = new GraphQLObjectType({
  name: "DeliveryInfo",
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
    shipperName: {
      type: GraphQLString,
      description:
        "The carrier handling the shipment as saved on the order (e.g., UPS, FedEx, DHL, USPS)",
    },
    shipperCode: {
      type: ShipperCodeType,
      description: "The code representing a known courier",
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
    tracking_id: rawTrackingNumber,
    shipper_name: rawShipperName,
  } = order.delivery_info
  let trackingURL: string | null

  const tracking = guessTracking(rawShipperName, rawTrackingNumber)
  const urlTemplate = tracking?.trackingUrl

  if (urlTemplate && tracking.trackingNumber) {
    // If urlTemplate is present it is in the format https://tools.usps.com/go/TrackConfirmAction?tLabels=%s
    // so we just need to format that into place using
    trackingURL = urlTemplate.replace(
      "%s",
      encodeURIComponent(tracking.trackingNumber)
    )
  } else {
    trackingURL = order.delivery_info.tracking_url ?? null
  }

  const shipperName = tracking?.courier?.name || rawShipperName || null
  const trackingNumber = tracking?.trackingNumber || rawTrackingNumber || null
  const shipperCode = getShipperCode(tracking)

  return {
    shipperName,
    shipperCode,
    trackingNumber,
    trackingURL,
  }
}

const getShipperCode = (tracking: TrackingNumber | null): string | null => {
  if (!tracking?.courier?.code) {
    return null
  }
  switch (tracking.courier.code.toUpperCase()) {
    case "UPS":
      return "UPS"
    case "FEDEX":
      return "FEDEX"
    case "DHL":
      return "DHL"
    case "USPS":
      return "USPS"
    default:
      return "OTHER"
  }
}

const guessTracking = (
  carrierName?: string,
  trackingNumber?: string
): TrackingNumber | null => {
  if (!trackingNumber) {
    return null
  }

  let tracking: TrackingNumber | undefined
  const normalizedCourier = carrierName?.toLowerCase()

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

  return tracking ?? null
}
