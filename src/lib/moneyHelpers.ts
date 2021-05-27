import currencyCodes from "lib/currency_codes.json"
import numeral from "numeral"

const symbolOnly = ["USD", "GBP", "EUR", "MYR"]

/**
 * Adds the currency to a price and returns the display text.
 * e.g. currencyPrefix("USD") => "$"
 * @param currency The currency iso code (e.g. USD = United States Dollar)
 */
export const currencyPrefix = (currency: string): string => {
  const currencyMap = currencyCodes[currency.toLowerCase()]

  if (!currencyMap) return ""

  const { symbol, disambiguate_symbol } = currencyMap

  if (symbolOnly.includes(currency)) {
    return symbol
  }

  return disambiguate_symbol || currency + " " + symbol
}

export const isCurrencySupported = (currency: string): boolean => {
  return currencyCodes[currency.toLowerCase()]
}

/**
 * Builds price display text (e.g. "$100").
 */
export const priceDisplayText = (
  priceCents: number,
  currency: string,
  format: string
): string => {
  const { subunit_to_unit } = currencyCodes[currency.toLowerCase()]

  const amount = Math.round(priceCents / subunit_to_unit)

  return currencyPrefix(currency) + numeral(amount).format(format)
}

/**
 * Builds price range display text (e.g. "$100-$200")..
 */
export const priceRangeDisplayText = (
  lowerPriceCents: number,
  higherPriceCents: number,
  currency: string,
  format: string
): string => {
  if (!lowerPriceCents || !higherPriceCents) {
    return priceDisplayText(
      lowerPriceCents || higherPriceCents,
      currency,
      format
    )
  }

  return (
    priceDisplayText(lowerPriceCents, currency, format) +
    "–" +
    priceDisplayText(higherPriceCents, currency, format)
  )
}
