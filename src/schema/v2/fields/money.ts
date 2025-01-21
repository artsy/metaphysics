import { assign } from "lodash"
import { formatMoney } from "accounting"
import {
  GraphQLString,
  GraphQLInt,
  GraphQLObjectType,
  GraphQLFloat,
  GraphQLInputObjectType,
  GraphQLNonNull,
  GraphQLBoolean,
} from "graphql"
import { ResolverContext } from "types/graphql"

// Taken from https://github.com/RubyMoney/money/blob/master/config/currency_iso.json
import currencyCodes from "lib/currency_codes.json"
import { GraphQLLong } from "lib/customTypes/GraphQLLong"
import { priceDisplayText } from "lib/moneyHelpers"

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
    disambiguate: {
      type: GraphQLBoolean,
      defaultValue: false,
    },
  },
  resolve: (obj, options) => {
    const cents = centsResolver(obj)

    const symbol =
      symbolFromCurrencyCode(obj.currencyCode, options.disambiguate) ||
      options.symbol ||
      obj.symbol

    if (typeof cents !== "number") {
      return null
    }

    const factor =
      currencyCodes[obj?.currencyCode?.toLowerCase()]?.subunit_to_unit ?? 100
    const major = cents / factor

    // Some objects return a currencyCode instead of a symbol.
    return formatMoney(
      major,
      assign({}, options, {
        symbol,
      })
    )
  },
})

export const symbolFromCurrencyCode = (currencyCode, disambiguate = false) => {
  if (!currencyCode) {
    return null
  }

  const disambiguateSymbol =
    currencyCodes[currencyCode.toLowerCase()]?.disambiguate_symbol

  const symbol = currencyCodes[currencyCode.toLowerCase()]?.symbol

  if (disambiguate) {
    return disambiguateSymbol ? disambiguateSymbol : symbol
  }

  return symbol
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

/**
 * Resolve the major unit of a money object.
 */
export const moneyMajorResolver = async (
  { cents, currency },
  { convertTo = null },
  { exchangeRatesLoader }
): Promise<number> => {
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
    const truncatedUSD = Number(convertedToUSD.toFixed(2))
    return truncatedUSD
  } else {
    return major
  }
}

export const Money = new GraphQLObjectType<any, ResolverContext>({
  name: "Money",
  fields: {
    minor: {
      type: new GraphQLNonNull(GraphQLLong),
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
      resolve: moneyMajorResolver,
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

/**
 * Money type resolver for either a major or minor money and currency code field.
 * Note that return values are not exactly what the money fields are due to other
 * legacy resolvers
 */
export const resolvePriceAndCurrencyFieldsToMoney = async (
  {
    currencyCode,
    ...args
  }:
    | { minor: number; major?: undefined; currencyCode: string }
    | { major: number; minor?: undefined; currencyCode: string },
  _args,
  context,
  _info
) => {
  try {
    const numericMoneyValue =
      typeof args.major === "number" || typeof args.minor === "number"
    if (!numericMoneyValue) {
      throw new Error("Either major or minor must be provided")
    }

    const major =
      typeof args.major === "number"
        ? args.major
        : await moneyMajorResolver(
            { cents: args.minor as number, currency: currencyCode },
            {},
            context
          )

    const minor =
      typeof args.minor === "number"
        ? args.minor
        : major * currencyCodes[currencyCode.toLowerCase()].subunit_to_unit

    return {
      major,
      cents: minor,
      currency: currencyCode,
      display: priceDisplayText(minor, currencyCode, ""),
    }
  } catch (error) {
    console.error(
      "v2/fields/money @resolveMinorAndCurrencyFieldsToMoney: Error:",
      error
    )
    return null
  }
}

export const resolveLotCentsFieldToMoney = (centsField) => {
  return async (parent, _args, context, _info) => {
    const { internalID, [centsField]: cents } = parent
    try {
      const { currency } = await context.saleArtworkRootLoader(internalID)
      const major = await moneyMajorResolver({ cents, currency }, {}, context)
      return {
        major,
        minor: cents,
        currencyCode: currency,
        display: formatMoney(major, symbolFromCurrencyCode(currency), 0),
      }
    } catch (error) {
      console.error(
        "v2/fields/money @resolveLotCentsFieldToMoney: Error:",
        error
      )
      return null
    }
  }
}

export default money
