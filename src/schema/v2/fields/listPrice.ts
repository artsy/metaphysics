import {
  GraphQLFieldConfig,
  GraphQLObjectType,
  GraphQLUnionType,
  GraphQLString,
} from "graphql"
import { Money, resolvePriceAndCurrencyFieldsToMoney } from "./money"

const PriceRange = new GraphQLObjectType({
  name: "PriceRange",
  fields: {
    display: {
      type: GraphQLString,
    },
    minPrice: {
      type: Money,
      resolve: (
        { minPriceCents: minor, price_currency: currencyCode },
        args,
        ctx,
        info
      ) => {
        if (!minor) return null
        return resolvePriceAndCurrencyFieldsToMoney(
          { minor, currencyCode },
          args,
          ctx,
          info
        )
      },
    },
    maxPrice: {
      type: Money,
      resolve: (
        { maxPriceCents: minor, price_currency: currencyCode },
        args,
        ctx,
        info
      ) => {
        if (!minor) return null
        return resolvePriceAndCurrencyFieldsToMoney(
          { minor, currencyCode },
          args,
          ctx,
          info
        )
      },
    },
  },
})

export const listPrice: GraphQLFieldConfig<any, any> = {
  type: new GraphQLUnionType({
    name: "ListPrice",
    types: [PriceRange, Money],
  }),
  resolve: async (
    { price_cents, price: displayPrice, price_currency },
    args,
    ctx,
    info
  ) => {
    if (!price_cents || price_cents.length === 0) {
      return null
    }
    const isExactPrice = price_cents.length === 1

    if (isExactPrice) {
      const moneyFields = await resolvePriceAndCurrencyFieldsToMoney(
        { minor: price_cents[0], currencyCode: price_currency },
        args,
        ctx,
        info
      )
      return {
        __typename: Money.name,
        ...moneyFields,
        // To support existing usage which assumes Gravity's Artwork#display_price
        // TODO: Update clients to use real `display` field with formatting string
        // if necessary
        display: displayPrice,
      }
    }
    return {
      // For deprecated types
      __typename: PriceRange.name,
      minPriceCents: price_cents[0],
      maxPriceCents: price_cents[1],

      // For preferred types
      price_currency,
      display: displayPrice,
    }
  },
}
