import { assign } from "lodash"
import { formatMoney } from "accounting"
import {
  GraphQLString,
  GraphQLInt,
  GraphQLObjectType,
  GraphQLFloat,
  GraphQLInputObjectType,
  GraphQLNonNull,
} from "graphql"
import { ResolverContext } from "types/graphql"

// Taken from https://github.com/RubyMoney/money/blob/master/config/currency_iso.json
import currencyCodes from "lib/currency_codes.json"

export const amountSDL = (name) => `
  ${name}(
    decimal: String = "."

    # Allows control of symbol position (%v = value, %s = symbol)
    format: String = "%s%v"
    precision: Int = 0
    symbol: String
    thousand: String = ","
  ): String
`

export const amount = (centsResolver) => ({
  type: GraphQLString,
  description: "A formatted price with various currency formatting options.",
  args: {
    decimal: {
      type: GraphQLString,
      defaultValue: ".",
    },
    format: {
      type: GraphQLString,
      description:
        "Allows control of symbol position (%v = value, %s = symbol)",
      defaultValue: "%s%v",
    },
    precision: {
      type: GraphQLInt,
      defaultValue: 0,
    },
    symbol: {
      type: GraphQLString,
    },
    thousand: {
      type: GraphQLString,
      defaultValue: ",",
    },
  },
  resolve: (obj, options) => {
    const cents = centsResolver(obj)
    const symbol =
      options.symbol || obj.symbol || symbolFromCurrencyCode(obj.currencyCode)

    if (typeof cents !== "number") {
      return null
    }

    // Some objects return a currencyCode instead of a symbol.
    return formatMoney(
      cents / 100,
      assign({}, options, {
        symbol,
      })
    )
  },
})

export const symbolFromCurrencyCode = (currencyCode) => {
  return currencyCode
    ? currencyCodes[currencyCode.toLowerCase()] &&
        currencyCodes[currencyCode.toLowerCase()].symbol
    : null
}

/**
 * @deprecated Don't use this constructor directly. Prefer using the `Money`
 * type instead.
 */
const money = ({ name, resolve }) => ({
  resolve: (x) => x,
  type: new GraphQLObjectType<any, ResolverContext>({
    name,
    fields: {
      amount: amount((obj) => resolve(obj).cents),
      cents: {
        type: GraphQLFloat,
        description: "An amount of money expressed in cents.",
        resolve: (obj) => {
          const { cents } = resolve(obj)
          if (!cents) return null
          return cents
        },
      },
      display: {
        type: GraphQLString,
        description: "A pre-formatted price.",
        resolve: (obj) => {
          const { display } = resolve(obj)
          if (!display) return null
          return display
        },
      },
    },
  }),
})

export const Money = new GraphQLObjectType<any, ResolverContext>({
  name: "Money",
  fields: {
    minor: {
      type: new GraphQLNonNull(GraphQLInt),
      description: "An amount of money expressed in minor units (like cents).",
      resolve: ({ cents }) => cents,
    },
    currencyCode: {
      type: new GraphQLNonNull(GraphQLString),
      description:
        "The ISO-4217 alphabetic currency code, as per https://en.wikipedia.org/wiki/ISO_4217",
      resolve: ({ currency }) => currency,
    },
    display: {
      type: GraphQLString,
      description: "A pre-formatted price.",
    },
    major: {
      type: new GraphQLNonNull(GraphQLFloat),
      description:
        "An amount of money expressed in major units (like dollars).",
      args: {
        convertTo: {
          type: GraphQLString,
          description: "ISO-4217 code of a destination currency for conversion",
        },
      },
      resolve: async (
        { cents, currency },
        { convertTo },
        { exchangeRatesLoader }
      ) => {
        const factor = currencyCodes[currency.toLowerCase()].subunit_to_unit
        // TODO: Should we round or used a fixed precision?
        const major = cents / factor

        const needsConversion = !!convertTo && convertTo !== currency
        if (needsConversion) {
          // from here, very USD specific
          if (convertTo !== "USD") {
            throw new Error("Only USD conversion is currently supported")
          }
          const exchangeRates = await exchangeRatesLoader()
          const convertedToUSD = major / exchangeRates[currency]
          const truncatedUSD = convertedToUSD.toFixed(2)
          return truncatedUSD
        } else {
          return major
        }
      },
    },
  },
})

export const MoneyInput = new GraphQLInputObjectType({
  name: "MoneyInput",
  fields: {
    amount: {
      type: new GraphQLNonNull(GraphQLFloat),
      description: "amount in dollars or major unit",
    },
    currencyCode: {
      type: new GraphQLNonNull(GraphQLString),
      description:
        "The ISO-4217 alphabetic currency code, as per https://en.wikipedia.org/wiki/ISO_4217",
    },
  },
})

export default money
