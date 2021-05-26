import currencyCodes from "lib/currency_codes.json"

const symbolOnly = ["USD", "GBP", "EUR", "MYR"]

const disambiguateSymbolOnly = ["HKD", "CAD", "AUD", "MXN"]

/**
 * Adds the currency to a price and returns the display text.
 * e.g. currencyPrefix("USD") => "$"
 * @param currency The currency iso code (e.g. USD = United States Dollar)
 */
export const currencyPrefix = (currency: string): string => {
  const currencyMap = currencyCodes[currency.toLowerCase()]

  if (!currencyMap) return ""

  const { symbol, disambiguate_symbol } = currencyMap
  // for non-U.S. currency symbols that use the dollar sign, we use the
  // disambiguate symbol with Dollar prefix (e.g. HK$ = Hong Kong Dollar)
  if (disambiguateSymbolOnly.includes(currency)) {
    return disambiguate_symbol
  }

  if (symbolOnly.includes(currency)) {
    return symbol
  }

  return currency + " " + symbol
}
