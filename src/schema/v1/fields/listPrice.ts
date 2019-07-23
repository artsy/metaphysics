import {
  GraphQLFieldConfig,
  GraphQLObjectType,
  GraphQLInt,
  GraphQLUnionType,
  GraphQLNonNull,
} from "graphql"

const PriceRange = new GraphQLObjectType({
  name: "PriceRange",
  fields: {
    minPriceCents: {
      type: new GraphQLNonNull(GraphQLInt),
    },
    maxPriceCents: {
      type: new GraphQLNonNull(GraphQLInt),
    },
  },
})

const ExactPrice = new GraphQLObjectType({
  name: "ExactPrice",
  fields: {
    priceCents: {
      type: new GraphQLNonNull(GraphQLInt),
    },
  },
})

export const listPrice: GraphQLFieldConfig<any, any> = {
  type: new GraphQLUnionType({
    name: "ListPrice",
    types: [PriceRange, ExactPrice],
  }),
  resolve: ({ price_cents }) => {
    if (!price_cents || price_cents.length === 0) {
      return null
    }
    const isExactPrice = price_cents.length === 1

    return isExactPrice
      ? {
          __typename: ExactPrice.name,
          priceCents: price_cents[0],
        }
      : {
          __typename: PriceRange.name,
          minPriceCents: price_cents[0],
          maxPriceCents: price_cents[1],
        }
  },
}
