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

const CourierCodeType = new GraphQLEnumType({
  name: "CourierCode",
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
  },
})

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
        "The carrier handling the shipment as saved on the order (e.g., UPS, FedEx, DHL, USPS)",
    },
    courierCode: {
      type: CourierCodeType,
      description: "The code representing a known courier",
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

  const { tracking_id: rawTrackingNumber, courier: rawCourier } = order.shipment
  let trackingURL: string | null

  const tracking = guessTracking(rawCourier, rawTrackingNumber)
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

  const courier = tracking?.courier?.name || rawCourier || null
  const trackingNumber = tracking?.trackingNumber || rawTrackingNumber || null
  const courierCode = tracking?.courier?.code?.toUpperCase() || null

  return {
    courier,
    trackingNumber,
    trackingURL,
    courierCode,
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
