import {
  currencyPrefix,
  priceDisplayText,
  priceRangeDisplayText,
} from "lib/moneyHelpers"

describe("currencyPrefix", () => {
  it("returns the currency symbol if in symbol only list", () => {
    expect(currencyPrefix("EUR")).toBe("€")
    expect(currencyPrefix("GBP")).toBe("£")
    expect(currencyPrefix("USD")).toBe("$")
    expect(currencyPrefix("MYR")).toBe("RM")
  })

  it("returns symbol with prefix if disambiguate_symbol exists", () => {
    expect(currencyPrefix("HKD")).toBe("HK$")
    expect(currencyPrefix("CAD")).toBe("C$")
    expect(currencyPrefix("AUD")).toBe("A$")
    expect(currencyPrefix("MXN")).toBe("MX$")
  })

  it("returns fallback if disambiguate_symbol doesn't exists", () => {
    expect(currencyPrefix("VUV")).toBe("VUV Vt")
    expect(currencyPrefix("LAK")).toBe("LAK ₭")
  })
})

describe("priceDisplayText", () => {
  it("builds display text", () => {
    expect(priceDisplayText(100, "EUR", "")).toBe("€1")
    expect(priceDisplayText(100, "CAD", "")).toBe("C$1")
    expect(priceDisplayText(100, "VUV", "")).toBe("VUV Vt100")
  })
})

describe("priceRangeDisplayText", () => {
  it("builds display text with range", () => {
    expect(priceRangeDisplayText(10000, 20000, "EUR", "")).toBe("€100–€200")
    expect(priceRangeDisplayText(100, 200, "MXN", "")).toBe("MX$1–MX$2")
    expect(priceRangeDisplayText(100, 200, "VUV", "")).toBe("VUV Vt100–Vt200")
  })

  it("builds display text with lowest", () => {
    expect(priceRangeDisplayText(10000, 0, "EUR", "")).toBe("€100")
  })

  it("builds display text with highest", () => {
    expect(priceRangeDisplayText(0, 20000, "EUR", "")).toBe("€200")
  })
})
