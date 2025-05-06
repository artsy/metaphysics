import {
  type GraphQLFieldConfig,
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
  // Tax* asterisk refers to a 'additional taxes may apply at import' disclaimer
  // would be nice to know when this is actually true
  tax: { displayName: "Tax*", fallbackAmountText: "Calculated in next steps" },
  total: {
    displayName: "Total",
    fallbackAmountText: "Waiting for final costs",
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
        },
        args,
        context,
        info
      )
    }

    const subtotalLine = {
      __typename: "SubtotalLine",
      amount: itemsTotalCents && resolveMoney(itemsTotalCents),
    }

    // TODO: Would be nice to know if
    const shippingLine = {
      __typename: "ShippingLine",
      amount: shippingTotalCents && resolveMoney(shippingTotalCents),
      fallbackAmountText:
        shippingTotalCents == null ? COPY.shipping.fallbackText : null,
    }

    const taxLine = {
      __typename: "TaxLine",
      amount: taxTotalCents && resolveMoney(taxTotalCents),
      fallbackAmountText:
        taxTotalCents == null ? COPY.tax.fallbackAmountText : null,
    }

    const totalLine = {
      __typename: "TotalLine",
      amount: buyerTotalCents && resolveMoney(buyerTotalCents),
      fallbackAmountText:
        buyerTotalCents == null ? COPY.total.fallbackAmountText : null,
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
      resolve: () => COPY.shipping.displayName,
    },
    fallbackAmountText: {
      type: GraphQLString,
      description: "Fallback text if no monetary amount is available",
      resolve: () => COPY.shipping.fallbackText,
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
      resolve: () => COPY.tax.displayName,
    },
    fallbackAmountText: {
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
      resolve: () => COPY.subtotal.displayName,
    },
    fallbackAmountText: {
      type: GraphQLString,
      description: "Fallback text if no monetary amount is available",
      resolve: () => null,
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
    fallbackAmountText: {
      type: GraphQLString,
      description: "Fallback text if no monetary amount is available",
    },
    amount: {
      type: Money,
      description: "The monetary amount for the line",
    },
  }),
})
