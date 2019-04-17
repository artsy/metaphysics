import {
  GraphQLFieldConfig,
  GraphQLObjectType,
  GraphQLInt,
  GraphQLBoolean,
} from "graphql"
import { ResolverContext } from "types/graphql"

export const priceCentsField: GraphQLFieldConfig<any, any> = {
  type: new GraphQLObjectType<any, ResolverContext>({
    name: "PriceCents",
    fields: {
      min: {
        type: GraphQLInt,
      },
      max: {
        type: GraphQLInt,
      },
      exact: {
        type: GraphQLBoolean,
      },
    },
  }),
  resolve: ({ price_cents }) => {
    if (!price_cents || price_cents.length === 0) {
      return null
    }
    const isExactPrice = price_cents.length === 1
    return {
      exact: isExactPrice,
      min: price_cents[0],
      max: isExactPrice ? price_cents[0] : price_cents[1],
    }
  },
}
