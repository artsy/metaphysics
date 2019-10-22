import {
  GraphQLFieldConfig,
  GraphQLObjectType,
  GraphQLInt,
  GraphQLUnionType,
  GraphQLNonNull,
  GraphQLString,
} from "graphql"
import { Price } from "./money"

const PriceRange = new GraphQLObjectType({
  name: "PriceRange",
  fields: {
    display: {
      type: GraphQLString,
    },
    minPriceCents: {
      type: new GraphQLNonNull(GraphQLInt),
      deprecationReason: "Prefer usage of minPrice",
    },
    minPrice: {
      type: Price,
      resolve: ({ minPriceCents, price_currency }) => {
        return {
          cents: minPriceCents,
          currency: price_currency,
        }
      },
    },
    maxPrice: {
      type: Price,
      resolve: ({ maxPriceCents, price_currency }) => {
        return {
          cents: maxPriceCents,
          currency: price_currency,
        }
      },
    },
    maxPriceCents: {
      type: new GraphQLNonNull(GraphQLInt),
      deprecationReason: "Prefer usage of maxPrice",
    },
  },
})

const ExactPrice = new GraphQLObjectType({
  name: "ExactPrice",
  fields: {
    priceCents: {
      type: new GraphQLNonNull(GraphQLInt),
      deprecationReason: "Prefer usage of price",
    },
    price: {
      type: Price,
      resolve: ({ price, price_cents, price_currency }) => {
        return {
          cents: price_cents && price_cents[0],
          display: price,
          currency: price_currency,
        }
      },
    },
  },
})

export const listPrice: GraphQLFieldConfig<any, any> = {
  type: new GraphQLUnionType({
    name: "ListPrice",
    types: [PriceRange, ExactPrice],
  }),
  resolve: ({ price_cents, price, price_currency }) => {
    if (!price_cents || price_cents.length === 0) {
      return null
    }
    const isExactPrice = price_cents.length === 1

    return isExactPrice
      ? {
          // For deprecated types
          __typename: ExactPrice.name,
          priceCents: price_cents[0],

          // For preferred types
          price_cents,
          price_currency,
          price,
        }
      : {
          // For deprecated types
          __typename: PriceRange.name,
          minPriceCents: price_cents[0],
          maxPriceCents: price_cents[1],

          // For preferred types
          price_currency,
          display: price,
        }
  },
}
