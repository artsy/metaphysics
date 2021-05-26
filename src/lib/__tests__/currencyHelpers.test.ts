import { currencyPrefix } from "lib/currencyHelpers"

describe("currencyPrefix", () => {
  it("returns the currency symbol", () => {
    expect(currencyPrefix("EUR")).toBe("€")
    expect(currencyPrefix("GBP")).toBe("£")
    expect(currencyPrefix("USD")).toBe("$")
  })

  it("returns symbol with prefix", () => {
    expect(currencyPrefix("HKD")).toBe("HK$")
    expect(currencyPrefix("CAD")).toBe("C$")
    expect(currencyPrefix("AUD")).toBe("A$")
    expect(currencyPrefix("MXN")).toBe("Mex$")
  })

  it("returns currency with symbol", () => {
    expect(currencyPrefix("LAK")).toBe("LAK ₭")
    expect(currencyPrefix("CNY")).toBe("CNY ¥")
    expect(currencyPrefix("JPY")).toBe("JPY ¥")
  })
})
