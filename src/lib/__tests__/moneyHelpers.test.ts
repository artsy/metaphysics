import {
  currencyPrefix,
  majorToMinor,
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

describe("majorToMinor", () => {
  describe("with the default currency (USD)", () => {
    it("converts whole amounts", () => {
      expect(majorToMinor("100")).toEqual({ success: true, minor: 10000 })
    })

    it("converts amounts with one or two decimals", () => {
      expect(majorToMinor("100.5")).toEqual({ success: true, minor: 10050 })
      expect(majorToMinor("100.50")).toEqual({ success: true, minor: 10050 })
      expect(majorToMinor("0.07")).toEqual({ success: true, minor: 7 })
    })

    it("avoids floating point drift", () => {
      expect(majorToMinor("19.99")).toEqual({ success: true, minor: 1999 })
      expect(majorToMinor("1.15")).toEqual({ success: true, minor: 115 })
      expect(majorToMinor("4.35")).toEqual({ success: true, minor: 435 })
    })

    it.each([
      ["a currency symbol", "$100"],
      ["thousands separators", "1,000"],
      ["a negative amount", "-100"],
      ["a leading plus sign", "+100"],
      ["non-numeric text", "abc"],
      ["an empty string", ""],
      ["surrounding whitespace", " 100 "],
      ["a missing whole part", ".50"],
      ["a trailing decimal point", "100."],
      ["more than two decimals", "100.505"],
      ["exponent notation", "1e3"],
      ["a second decimal point", "1.0.0"],
    ])("rejects %s", (_description, input) => {
      const result = majorToMinor(input)

      expect(result.success).toBe(false)
    })

    it("explains why an amount was rejected", () => {
      expect(majorToMinor("$100")).toEqual({
        success: false,
        error:
          "Price must be a plain number like 100 or 100.50, without currency symbols or separators",
      })
      expect(majorToMinor("100.505")).toEqual({
        success: false,
        error: "Price can have at most 2 decimal places for USD",
      })
    })

    it("rejects amounts too large to represent exactly", () => {
      const result = majorToMinor("99999999999999999")

      expect(result.success).toBe(false)
    })
  })

  describe("with other currencies", () => {
    it("uses the currency’s subunit size", () => {
      expect(majorToMinor("100", "JPY")).toEqual({ success: true, minor: 100 })
      expect(majorToMinor("1.234", "KWD")).toEqual({
        success: true,
        minor: 1234,
      })
    })

    it("rejects too many decimals for the currency", () => {
      expect(majorToMinor("100.5", "JPY")).toEqual({
        success: false,
        error: "Price can have at most 0 decimal places for JPY",
      })
    })

    it("is case insensitive about the currency code", () => {
      expect(majorToMinor("1.50", "eur")).toEqual({ success: true, minor: 150 })
    })

    it("rejects unknown currencies", () => {
      expect(majorToMinor("100", "XXX")).toEqual({
        success: false,
        error: "Unsupported currency: XXX",
      })
    })

    it("rejects currencies whose subunit is not a power of ten", () => {
      expect(majorToMinor("100", "MGA")).toEqual({
        success: false,
        error: "Unsupported currency: MGA",
      })
    })
  })
})
