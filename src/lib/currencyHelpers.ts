import currencyCodes from "lib/currency_codes.json"

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

  return disambiguate_symbol || symbol
}
