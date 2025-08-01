import {
  GraphQLFieldConfig,
  GraphQLObjectType,
  GraphQLUnionType,
  GraphQLString,
} from "graphql"
import { Money } from "./money"
import { priceDisplayText, priceRangeDisplayText } from "lib/moneyHelpers"

const PriceRange = new GraphQLObjectType({
  name: "PriceRange",
  fields: {
    display: {
      type: GraphQLString,
    },
    minPrice: {
      type: Money,
      resolve: ({ minPriceCents, price_currency }) => {
        if (!minPriceCents || !price_currency) return null
        return {
          cents: minPriceCents,
          currency: price_currency,
        }
      },
    },
    maxPrice: {
      type: Money,
      resolve: ({ maxPriceCents, price_currency }) => {
        if (!maxPriceCents || !price_currency) return null
        return {
          cents: maxPriceCents,
          currency: price_currency,
        }
      },
    },
  },
})

export const listPrice: GraphQLFieldConfig<any, any> = {
  type: new GraphQLUnionType({
    name: "ListPrice",
    types: [PriceRange, Money],
  }),
  resolve: ({ price_cents, price_currency }) => {
    if (!price_cents || price_cents.length === 0 || !price_currency) {
      return null
    }
    const isExactPrice = price_cents.length === 1

    return isExactPrice
      ? {
          __typename: Money.name,
          cents: price_cents[0],
          display: priceDisplayText(price_cents[0], price_currency, ""),
          currency: price_currency,
        }
      : {
          // For deprecated types
          __typename: PriceRange.name,
          minPriceCents: price_cents[0],
          maxPriceCents: price_cents[1],

          // For preferred types
          price_currency,
          display: priceRangeDisplayText(
            price_cents[0],
            price_cents[1],
            price_currency,
            ""
          ),
        }
  },
}
