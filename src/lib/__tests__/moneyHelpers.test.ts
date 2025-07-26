import {
  currencyPrefix,
  priceDisplayText,
  priceRangeDisplayText,
} from "lib/moneyHelpers"

describe("currencyPrefix", () => {
  it("returns the currency symbol if in symbol only list", () => {
    expect(currencyPrefix("EUR")).toBe("€")
    expect(currencyPrefix("GBP")).toBe("£")
    expect(currencyPrefix("MYR")).toBe("RM")
  })

  it("returns symbol with prefix if disambiguate_symbol exists", () => {
    expect(currencyPrefix("USD")).toBe("US$")
    expect(currencyPrefix("HKD")).toBe("HK$")
    expect(currencyPrefix("CAD")).toBe("C$")
    expect(currencyPrefix("AUD")).toBe("AU$")
    expect(currencyPrefix("MXN")).toBe("MX$")
  })

  it("returns fallback if disambiguate_symbol doesn't exists", () => {
    expect(currencyPrefix("VUV")).toBe("VUV Vt")
    expect(currencyPrefix("LAK")).toBe("LAK ₭")
  })
})

describe("priceDisplayText", () => {
  it("builds display text", () => {
    expect(priceDisplayText(100, "USD", "")).toBe("US$1")
    expect(priceDisplayText(100, "EUR", "")).toBe("€1")
    expect(priceDisplayText(100, "CAD", "")).toBe("C$1")
    expect(priceDisplayText(100, "VUV", "")).toBe("VUV Vt100")
  })
})

describe("priceRangeDisplayText", () => {
  it("builds display text with range", () => {
    expect(priceRangeDisplayText(10000, 20000, "USD", "")).toBe("US$100–US$200")
    expect(priceRangeDisplayText(10000, 20000, "EUR", "")).toBe("€100–€200")
    expect(priceRangeDisplayText(100, 200, "MXN", "")).toBe("MX$1–MX$2")
    expect(priceRangeDisplayText(100, 200, "VUV", "")).toBe("VUV Vt100–Vt200")
  })

  it("doesn't care if low and high prices passed in are out of order", () => {
    expect(priceRangeDisplayText(10000, 0, "EUR", "")).toBe("€100–€0")
    expect(priceRangeDisplayText(10000, 100, "EUR", "")).toBe("€100–€1")
  })

  it("returns an empty string when both low and high prices are empty", () => {
    expect(priceRangeDisplayText(null, null, "EUR", "")).toBe("")
  })

  it("prepends text 'Under' when low price is not given", () => {
    expect(priceRangeDisplayText(null, 10000, "EUR", "")).toBe("Under €100")
    expect(priceRangeDisplayText(null, 100, "VUV", "")).toBe("Under VUV Vt100")
  })

  it("appends text 'and up' when high price is not given", () => {
    expect(priceRangeDisplayText(10000, null, "EUR", "")).toBe(
      "Starting at €100"
    )
    expect(priceRangeDisplayText(100, null, "VUV", "")).toBe(
      "Starting at VUV Vt100"
    )
  })
})
