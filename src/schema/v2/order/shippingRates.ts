import { GraphQLObjectType, GraphQLNonNull, GraphQLString } from "graphql"

import { ResolverContext } from "types/graphql"
import { Money } from "../fields/money"

// TODO: Actual country code lists
const EU_COUNTRY_CODES = ["FR", "DE", "IT", "ES"]
const ALL_COUNTRY_CODES = ["US", "BR", "GB", "FR", "DE", "IT", "ES"]

export const ShippingRateType = new GraphQLObjectType<any, ResolverContext>({
  name: "ShippingRate",
  fields: {
    id: {
      type: new GraphQLNonNull(GraphQLString),
    },
    quoteId: {
      type: GraphQLString,
    },
    amount: {
      type: Money,
      resolve: ({ amount }) => amount,
    },
  },
})

enum ShippingRate {
  PICKUP = "PICKUP",
  DOMESTIC_FLAT = "DOMESTIC_FLAT",
  DOMESTIC_CALCULATED = "DOMESTIC_CALCULATED",
  INTERNATIONAL_FLAT = "INTERNATIONAL_FLAT",
  INTERNATIONAL_CALCULATED = "INTERNATIONAL_CALCULATED",
}
interface ShippingRateResult {
  id:
    | "PICKUP"
    | "DOMESTIC_FLAT"
    | "DOMESTIC_CALCULATED"
    | "INTERNATIONAL_FLAT"
    | "INTERNATIONAL_CALCULATED"
    | "CALCULATING"
  quoteId?: string

  // TODO: Construct full money-resolvable type, not just cents (minor)
  amount: { cents: number } | null
}

const PICKUP_RATE = {
  id: ShippingRate.PICKUP,
  amount: { cents: 0 },
}

export const resolveShippingRates = ({ lineItem, artwork, order }) => {
  const rates: Array<ShippingRateResult> = []
  console.log({ lineItem, artwork, order })
  const { shipping_country: shipsTo } = order

  const shippingRules = calculateShippingRules(artwork)

  console.log({ shippingRules })
  if (shipsTo) {
    if (shippingRules.domesticShippingCountries.includes(shipsTo)) {
      const rate = shippingRules.domesticShipping
      if (rate === "ARTSY_SHIPPING") {
        // TODO: Implement artsy shipping rates
        rates.push({
          id: ShippingRate.DOMESTIC_CALCULATED,
          quoteId: "domestic-calculated",
          amount: { cents: 0 },
        })
      }
      if (typeof rate === "number") {
        rates.push({
          id: ShippingRate.DOMESTIC_FLAT,
          amount: { cents: rate },
        })
      }
    } else {
      const rate = shippingRules.internationalShipping
      if (rate === "ARTSY_SHIPPING") {
        // TODO: Implement artsy shipping rates
        rates.push({
          id: ShippingRate.INTERNATIONAL_CALCULATED,
          quoteId: "international-calculated",
          amount: { cents: 0 },
        })
      } else if (typeof rate === "number") {
        rates.push({
          id: ShippingRate.INTERNATIONAL_FLAT,
          amount: { cents: rate },
        })
      }
    }
  } else {
    rates.push({
      id: "CALCULATING",
      amount: null,
    })
  }
  if (shippingRules.pickupAvailable) {
    rates.unshift(PICKUP_RATE)
  }

  return rates
}

type ShippingCostType = number | "ARTSY_SHIPPING" | null

const calculateShippingRules = (artwork) => {
  const {
    pickup_available: pickupAvailable,
    process_with_artsy_shipping_domestic: processWithArtsyShippingDomestic,
    artsy_shipping_international: artsyShippingInternational,
    domestic_shipping_fee_cents: domesticShippingFeeCents,
    international_shipping_fee_cents: internationalShippingFeeCents,
    eu_shipping_origin: euShippingOrigin,
    shipping_origin: shippingOrigin,
  } = artwork

  const domesticShipping: ShippingCostType =
    (processWithArtsyShippingDomestic && "ARTSY_SHIPPING") ||
    domesticShippingFeeCents

  const internationalShipping: ShippingCostType =
    (artsyShippingInternational && "ARTSY_SHIPPING") ||
    internationalShippingFeeCents

  const onlyShipsDomestically: boolean =
    domesticShipping !== null && internationalShipping === null

  const shipsFrom = shippingOrigin[shippingOrigin.length - 1]

  const domesticShippingCountries: string[] = euShippingOrigin
    ? EU_COUNTRY_CODES
    : [shipsFrom]

  const availableShippingCountries: string[] = onlyShipsDomestically
    ? domesticShippingCountries
    : ALL_COUNTRY_CODES

  return {
    pickupAvailable,
    availableShippingCountries,
    domesticShippingCountries,
    shipsFrom,
    domesticShipping,
    internationalShipping,
    onlyShipsDomestically,
  }
}
