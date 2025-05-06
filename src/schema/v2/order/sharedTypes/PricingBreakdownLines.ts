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
import type { OrderJSON } from "./sharedOrderTypes"

const COPY = {
  subtotal: { displayName: "Subtotal" },
  shipping: {
    displayName: "Shipping",
    fallbackText: "Calculated in next steps",
  },
  tax: { displayName: "Tax", amountFallbackText: "Calculated in next steps" },
  total: {
    displayName: "Total",
    amountFallbackText: "Waiting for final costs",
  },
} as const

export const PricingBreakdownLineUnion = new GraphQLUnionType({
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

export const PricingBreakdownLines: GraphQLFieldConfig<
  OrderJSON,
  ResolverContext
> = {
  description: "Order pricing breakdown lines",
  type: new GraphQLNonNull(new GraphQLList(PricingBreakdownLineUnion)),
  resolve: (order, args, context, info) => {
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

    // TODO: Would be nice to know if shipping applies
    const hasShippingTotal = shippingTotalCents != null
    const shippingLine = order.fulfillment_type !== "PICKUP" && {
      __typename: "ShippingLine",
      displayName: COPY.shipping.displayName,
      amount: hasShippingTotal ? resolveMoney(shippingTotalCents) : null,
      amountFallbackText: hasShippingTotal ? null : COPY.shipping.fallbackText,
    }

    // TODO: Would be nice to know if tax applies (US only) and if the asterisk
    // applies (e.g. if the order is shipped across borders)
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

    return [subtotalLine, shippingLine, taxLine, totalLine].filter(Boolean)
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
      resolve: () => COPY.total.displayName,
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
