import {
  GraphQLList,
  GraphQLNonNull,
  GraphQLObjectType,
  GraphQLString,
  GraphQLUnionType,
} from "graphql"
import {
  Money,
  resolveMinorAndCurrencyFieldsToMoney,
} from "schema/v2/fields/money"
import { OrderJSON, FulfillmentOptionJson } from "./exchangeJson"
import { OfferJSON } from "./OfferType"

const COPY = {
  subtotal: {
    displayName: {
      price: "Price",
      galleryOffer: "Gallery offer",
      counterOffer: "Seller's offer",
      makeOffer: "Your offer",
    },
  },
  shipping: {
    displayName: {
      pickup: "Pickup",
      fallback: "Shipping",
      flatFee: "Flat rate shipping",
      free: "Free shipping",
      standard: "Standard shipping",
      express: "Express shipping",
      whiteGlove: "White glove shipping",
    },
    fallbackText: "Calculated in next steps",
  },
  tax: { displayName: "Tax", amountFallbackText: "Calculated in next steps" },
  total: {
    displayName: "Total",
    amountFallbackText: "Waiting for final costs",
  },
} as const

const PricingBreakdownLineUnion = new GraphQLUnionType({
  name: "PricingBreakdownLineUnion",
  description: "Pricing breakdown line",
  types: () => [ShippingLine, TaxLine, SubtotalLine, TotalLine],
  resolveType: (value) => {
    if (value.__typename === "ShippingLine") {
      return ShippingLine
    }
    if (value.__typename === "TaxLine") {
      return TaxLine
    }
    if (value.__typename === "SubtotalLine") {
      return SubtotalLine
    }
    if (value.__typename === "TotalLine") {
      return TotalLine
    }
    return null
  },
})

// Shared type for pricing breakdown lines
export const PricingBreakdownLinesType = new GraphQLNonNull(
  new GraphQLList(PricingBreakdownLineUnion)
)

type ResolvedPriceLineData = {
  __typename: "ShippingLine" | "TaxLine" | "SubtotalLine" | "TotalLine"
  displayName: string
  amount: ReturnType<typeof resolveMinorAndCurrencyFieldsToMoney> | null
  amountFallbackText: string | null
}

export const resolveOrderPricingBreakdownLines = (
  order: OrderJSON,
  args,
  context,
  info
): ResolvedPriceLineData[] => {
  const {
    currency_code: currencyCode,
    shipping_total_cents: shippingTotalCents,
    tax_total_cents: taxTotalCents,
    items_total_cents: itemsTotalCents,
    buyer_total_cents: buyerTotalCents,
    source,
  } = order

  const resolveMoney = (amount: number) => {
    return resolveMinorAndCurrencyFieldsToMoney(
      {
        minor: amount,
        currencyCode,
        format: "0,0[.]00",
        exact: true,
      },
      args,
      context,
      info
    )
  }

  // Subtotal line uses order.items_total_cents
  const subtotalLine: ResolvedPriceLineData = {
    __typename: "SubtotalLine",
    displayName:
      source === "partner_offer"
        ? COPY.subtotal.displayName.galleryOffer
        : COPY.subtotal.displayName.price,
    amount: itemsTotalCents != null ? resolveMoney(itemsTotalCents) : null,
    amountFallbackText: null,
  }

  // Shipping line
  const selectedFulfillment: FulfillmentOptionJson = order.selected_fulfillment_option || {
    type: "shipping_tbd",
  }

  const hasShippingTotal = shippingTotalCents != null
  let shippingDisplayName: string = COPY.shipping.displayName.fallback

  switch (selectedFulfillment?.type) {
    case "pickup":
      shippingDisplayName = COPY.shipping.displayName.pickup
      break
    case "artsy_standard":
      shippingDisplayName = COPY.shipping.displayName.standard
      break
    case "artsy_express":
      shippingDisplayName = COPY.shipping.displayName.express
      break
    case "artsy_white_glove":
      shippingDisplayName = COPY.shipping.displayName.whiteGlove
      break
    case "domestic_flat":
    case "international_flat":
      if (shippingTotalCents === 0) {
        shippingDisplayName = COPY.shipping.displayName.free
      } else {
        shippingDisplayName = COPY.shipping.displayName.flatFee
      }
      break
    case "shipping_tbd":
      shippingDisplayName = COPY.shipping.displayName.fallback
      break
  }

  const shippingLine: ResolvedPriceLineData = {
    __typename: "ShippingLine",
    displayName: shippingDisplayName,
    amount: hasShippingTotal ? resolveMoney(shippingTotalCents) : null,
    amountFallbackText: hasShippingTotal ? null : COPY.shipping.fallbackText,
  }

  // Tax line
  const hasTaxTotal = taxTotalCents != null
  const taxLine: ResolvedPriceLineData = {
    __typename: "TaxLine",
    displayName: COPY.tax.displayName,
    amount: hasTaxTotal ? resolveMoney(taxTotalCents) : null,
    amountFallbackText: hasTaxTotal ? null : COPY.tax.amountFallbackText,
  }

  // Total line uses order.buyer_total_cents
  const hasBuyerTotal = buyerTotalCents != null
  const totalLine: ResolvedPriceLineData = {
    __typename: "TotalLine",
    displayName: COPY.total.displayName,
    amount: hasBuyerTotal ? resolveMoney(buyerTotalCents) : null,
    amountFallbackText: hasBuyerTotal ? null : COPY.total.amountFallbackText,
  }

  return [subtotalLine, shippingLine, taxLine, totalLine]
}

export const resolveOfferPricingBreakdownLines = (
  offer: OfferJSON,
  args,
  context,
  info
): ResolvedPriceLineData[] => {
  const {
    currency_code: currencyCode,
    shipping_total_cents: shippingTotalCents,
    tax_total_cents: taxTotalCents,
    amount_cents: amountCents,
    buyer_total_cents: buyerTotalCents,
    from_participant: fromParticipant,
  } = offer

  const resolveMoney = (amount: number) => {
    return resolveMinorAndCurrencyFieldsToMoney(
      {
        minor: amount,
        currencyCode,
        format: "0,0[.]00",
        exact: true,
      },
      args,
      context,
      info
    )
  }

  // Subtotal line uses offer.amount_cents
  // Display name depends on who made the offer
  const subtotalDisplayName =
    fromParticipant === "buyer"
      ? COPY.subtotal.displayName.makeOffer
      : COPY.subtotal.displayName.counterOffer

  const subtotalLine: ResolvedPriceLineData = {
    __typename: "SubtotalLine",
    displayName: subtotalDisplayName,
    amount: amountCents != null ? resolveMoney(amountCents) : null,
    amountFallbackText: null,
  }

  // Shipping line
  const hasShippingTotal = shippingTotalCents != null
  const shippingLine: ResolvedPriceLineData = {
    __typename: "ShippingLine",
    displayName: COPY.shipping.displayName.fallback,
    amount: hasShippingTotal ? resolveMoney(shippingTotalCents) : null,
    amountFallbackText: hasShippingTotal ? null : COPY.shipping.fallbackText,
  }

  // Tax line
  const hasTaxTotal = taxTotalCents != null
  const taxLine: ResolvedPriceLineData = {
    __typename: "TaxLine",
    displayName: COPY.tax.displayName,
    amount: hasTaxTotal ? resolveMoney(taxTotalCents) : null,
    amountFallbackText: hasTaxTotal ? null : COPY.tax.amountFallbackText,
  }

  // Total line uses offer.buyer_total_cents
  const hasBuyerTotal = buyerTotalCents != null
  const totalLine: ResolvedPriceLineData = {
    __typename: "TotalLine",
    displayName: COPY.total.displayName,
    amount: hasBuyerTotal ? resolveMoney(buyerTotalCents) : null,
    amountFallbackText: hasBuyerTotal ? null : COPY.total.amountFallbackText,
  }

  return [subtotalLine, shippingLine, taxLine, totalLine]
}

const ShippingLine = new GraphQLObjectType({
  name: "ShippingLine",
  description: "Shipping line",
  fields: () => ({
    displayName: {
      type: new GraphQLNonNull(GraphQLString),
      description: "Display name of the shipping line",
    },
    amountFallbackText: {
      type: GraphQLString,
      description: "Fallback text if no monetary amount is available",
    },
    amount: {
      type: Money,
      description: "The monetary amount for the line",
    },
  }),
})

const TaxLine = new GraphQLObjectType({
  name: "TaxLine",
  description: "Tax line",
  fields: () => ({
    displayName: {
      type: new GraphQLNonNull(GraphQLString),
      description: "Display name of the tax line",
    },
    amountFallbackText: {
      type: GraphQLString,
      description: "Fallback text if no monetary amount is available",
    },
    amount: {
      type: Money,
      description: "The monetary amount for the line",
    },
  }),
})

const SubtotalLine = new GraphQLObjectType({
  name: "SubtotalLine",
  description: "Subtotal line",
  fields: () => ({
    displayName: {
      type: new GraphQLNonNull(GraphQLString),
      description: "Display name of the subtotal line",
    },
    amountFallbackText: {
      type: GraphQLString,
      description: "Fallback text if no monetary amount is available",
    },
    amount: {
      type: Money,
      description: "The monetary amount for the line",
    },
  }),
})

const TotalLine = new GraphQLObjectType({
  name: "TotalLine",
  description: "Total line",
  fields: () => ({
    displayName: {
      type: new GraphQLNonNull(GraphQLString),
      description: "Display name of the total line",
    },
    amountFallbackText: {
      type: GraphQLString,
      description: "Fallback text if no monetary amount is available",
    },
    amount: {
      type: Money,
      description: "The monetary amount for the line",
    },
  }),
})
