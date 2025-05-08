import {
  GraphQLFieldConfig,
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
import type { ResolverContext } from "types/graphql"
import { OrderJSON } from "./exchangeJson"

const COPY = {
  subtotal: { displayName: "Subtotal" },
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

type ResolvedPriceLineData = {
  __typename: "ShippingLine" | "TaxLine" | "SubtotalLine" | "TotalLine"
  displayName: string
  amount: ReturnType<typeof resolveMinorAndCurrencyFieldsToMoney> | null
  amountFallbackText: string | null
}

export const PricingBreakdownLines: GraphQLFieldConfig<
  OrderJSON,
  ResolverContext
> = {
  description: "Order pricing breakdown lines",
  type: new GraphQLNonNull(new GraphQLList(PricingBreakdownLineUnion)),
  resolve: (order, args, context, info): ResolvedPriceLineData[] => {
    const {
      currency_code: currencyCode,
      shipping_total_cents: shippingTotalCents,
      tax_total_cents: taxTotalCents,
      items_total_cents: itemsTotalCents,
      buyer_total_cents: buyerTotalCents,
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

    const subtotalLine = {
      __typename: "SubtotalLine",
      displayName: COPY.subtotal.displayName,
      amount: itemsTotalCents && resolveMoney(itemsTotalCents),
    }

    const selectedFulfillment = order.fulfillment_options.find(
      (option) => option.selected
    )

    let shippingLine: ResolvedPriceLineData | null = null
    const hasShippingTotal = shippingTotalCents != null
    const amounts = {
      amount: hasShippingTotal ? resolveMoney(shippingTotalCents) : null,
      amountFallbackText: hasShippingTotal ? null : COPY.shipping.fallbackText,
    }

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

    shippingLine = {
      __typename: "ShippingLine",
      displayName: shippingDisplayName,
      ...amounts,
    }

    const hasTaxTotal = taxTotalCents != null
    const taxLine = {
      __typename: "TaxLine",
      displayName: COPY.tax.displayName,
      amount: hasTaxTotal ? resolveMoney(taxTotalCents) : null,
      amountFallbackText: hasTaxTotal ? null : COPY.tax.amountFallbackText,
    }

    const hasBuyerTotal = buyerTotalCents != null

    const totalLine = {
      __typename: "TotalLine",
      displayName: COPY.total.displayName,
      amount: hasBuyerTotal ? resolveMoney(buyerTotalCents) : null,
      amountFallbackText: hasBuyerTotal ? null : COPY.total.amountFallbackText,
    }

    return [subtotalLine, shippingLine, taxLine, totalLine].filter(
      Boolean
    ) as ResolvedPriceLineData[]
  },
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
