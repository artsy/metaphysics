import currencyCodes from "lib/currency_codes.json"
import numeral from "numeral"

const symbolOnly = ["GBP", "EUR", "MYR"]

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

export const currencyCodeMap = (currency: string) => {
  return currencyCodes[currency.toLowerCase()]
}

export const priceAmount = (
  priceCents: number,
  currency: string,
  format: string,
  exact = false
): string => {
  const { subunit_to_unit } = currencyCodes[currency.toLowerCase()]

  const major = priceCents / subunit_to_unit

  const amount = exact ? major : Math.round(major)

  return numeral(amount).format(format)
}

export const isCurrencySupported = (currency: string): boolean => {
  return currencyCodes[currency.toLowerCase()]
}

/**
 * Builds price display text (e.g. "US$100").
 */
export const priceDisplayText = (
  priceCents: number,
  currency: string,
  format: string,
  exact?: boolean
): string => {
  return (
    currencyPrefix(currency) + priceAmount(priceCents, currency, format, exact)
  )
}

/**
 * Builds price range display text (e.g. "US$100–US$200" or "VUV Vt100–Vt200")..
 */
export const priceRangeDisplayText = (
  lowerPriceCents: number | null,
  higherPriceCents: number | null,
  currency: string,
  format: string
): string => {
  if (lowerPriceCents == null && higherPriceCents == null) {
    return ""
  }

  const fullPrefix = currencyPrefix(currency)
  const shortPrefix = fullPrefix.includes(" ")
    ? fullPrefix.split(" ")[1]
    : fullPrefix

  if (lowerPriceCents == null) {
    const amount = priceAmount(higherPriceCents as number, currency, format)
    return `Under ${fullPrefix}${amount}`
  }

  if (higherPriceCents == null) {
    const amount = priceAmount(lowerPriceCents as number, currency, format)
    return `Starting at ${fullPrefix}${amount}`
  }

  const low = priceAmount(lowerPriceCents, currency, format)
  const high = priceAmount(higherPriceCents, currency, format)

  return `${fullPrefix}${low}–${shortPrefix}${high}`
}

type MajorToMinorResult =
  | { success: true; minor: number }
  | { success: false; error: string }

const PLAIN_DECIMAL_PATTERN = /^\d+(\.\d+)?$/

/**
 * Converts a major-unit amount string (e.g. "100.50") to minor units (e.g. 10050).
 * Returns a failure result rather than throwing, so callers choose how to surface it.
 * @param amount A plain decimal string, without currency symbols or separators
 * @param currencyCode The currency iso code, defaults to USD
 */
export const majorToMinor = (
  amount: string,
  currencyCode = "USD"
): MajorToMinorResult => {
  const currency = currencyCodeMap(currencyCode)
  const subunitToUnit: number | undefined = currency?.subunit_to_unit
  const decimalPlaces = subunitToUnit ? String(subunitToUnit).length - 1 : 0

  if (!subunitToUnit || 10 ** decimalPlaces !== subunitToUnit) {
    return { success: false, error: `Unsupported currency: ${currencyCode}` }
  }

  if (!PLAIN_DECIMAL_PATTERN.test(amount)) {
    return {
      success: false,
      error:
        "Price must be a plain number like 100 or 100.50, without currency symbols or separators",
    }
  }

  const [whole, fraction = ""] = amount.split(".")

  if (fraction.length > decimalPlaces) {
    return {
      success: false,
      error: `Price can have at most ${decimalPlaces} decimal places for ${currencyCode.toUpperCase()}`,
    }
  }

  const fractionMinor =
    decimalPlaces === 0 ? 0 : Number(fraction.padEnd(decimalPlaces, "0"))
  const minor = Number(whole) * subunitToUnit + fractionMinor

  if (!Number.isSafeInteger(minor)) {
    return { success: false, error: "Price is too large" }
  }

  return { success: true, minor }
}
