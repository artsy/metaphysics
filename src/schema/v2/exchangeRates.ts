import { ExchangeRateType } from "./exchangeRate"
import { GraphQLFieldConfig, GraphQLList, GraphQLNonNull } from "graphql"
import { ResolverContext } from "types/graphql"

export const ExchangeRates: GraphQLFieldConfig<void, ResolverContext> = {
  type: new GraphQLList(new GraphQLNonNull(ExchangeRateType)),
  description: "A list of exchange rates from USD to other currencies.",
  resolve: async (_root, _args, { exchangeRatesLoader }) => {
    const rates = await exchangeRatesLoader()
    return Object.entries(rates).map(([currencyCode, rate]) => ({
      currencyCode,
      rate,
    }))
  },
}
