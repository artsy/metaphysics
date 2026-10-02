import {
  GraphQLFieldConfig,
  GraphQLString,
  GraphQLObjectType,
  GraphQLFloat,
} from "graphql"
import { ResolverContext } from "types/graphql"

export const ExchangeRateType = new GraphQLObjectType<any, ResolverContext>({
  name: "ExchangeRate",
  fields: {
    currencyCode: { type: GraphQLString },
    rate: { type: GraphQLFloat },
  },
})

export const ExchangeRate: GraphQLFieldConfig<void, ResolverContext> = {
  type: ExchangeRateType,
}
