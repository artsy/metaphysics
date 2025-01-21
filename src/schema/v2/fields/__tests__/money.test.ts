import { amount, resolvePriceAndCurrencyFieldsToMoney } from "../money"
import { runQuery } from "schema/v2/test/utils"
import gql from "lib/gql"

describe("amount", () => {
  const getResult = ({
    obj = {},
    args = { symbol: "$" } as Record<string, unknown>,
    amountCents = 1234 as any,
  }) => amount(() => amountCents).resolve(obj, args)

  it("formats dollars", () => {
    expect(getResult({})).toMatchInlineSnapshot(`"$12.34"`)
  })

  it("formats euros", () => {
    expect(getResult({ args: { symbol: "€" } })).toMatchInlineSnapshot(
      `"€12.34"`
    )
  })

  it("formats yen", () => {
    expect(getResult({ args: { symbol: "¥" } })).toMatchInlineSnapshot(
      `"¥12.34"`
    )
  })

  it("handles zeroes", () => {
    expect(getResult({ amountCents: 0 })).toMatchInlineSnapshot(`"$0.00"`)
  })

  it("handles null/undefined", () => {
    expect(getResult({ amountCents: null })).toMatchInlineSnapshot(`null`)

    // custom handling since undefined won't override a default argument
    expect(amount(() => undefined).resolve({}, {})).toMatchInlineSnapshot(
      `null`
    )
  })

  it("formats from a currencyCode if provided", () => {
    expect(
      getResult({
        obj: { currencyCode: "GBP" },
        args: {},
      })
    ).toMatchInlineSnapshot(`"£12.34"`)
  })

  it("respects major / minor unit conversion ratio if currencyCode passed in", () => {
    expect(
      getResult({
        obj: { currencyCode: "CLF" },
        args: {},
      })
    ).toMatchInlineSnapshot(`"UF0.12"`)
  })

  it("prefers object symbol over currencyCode", () => {
    expect(
      getResult({
        obj: { symbol: "$", currencyCode: "GBP" },
        args: {},
      })
    ).toMatchInlineSnapshot(`"£12.34"`)
  })

  it("prefers argument symbol over currencyCode", () => {
    expect(
      getResult({
        obj: { symbol: "£", currencyCode: "GBP" },
      })
    ).toMatchInlineSnapshot(`"£12.34"`)
  })

  it("doesn't break when it can't find a currencyCode", () => {
    expect(getResult({ obj: { currencyCode: "BLAH" } })).toMatchInlineSnapshot(
      `"$12.34"`
    )
  })

  it("returns disambiguate symbol over symbol when optional param passed", () => {
    expect(
      getResult({
        obj: { currencyCode: "USD", symbol: "$" },
        args: { disambiguate: true },
      })
    ).toMatchInlineSnapshot(`"US$12.34"`)
  })

  it("returns symbol over disambiguate symbol by default", () => {
    expect(
      getResult({
        obj: { currencyCode: "USD", symbol: "$" },
      })
    ).toMatchInlineSnapshot(`"$12.34"`)
  })
})

describe("major(convertTo:)", () => {
  const mockArtworkContext = (mockArtwork) => {
    return {
      artworkLoader: () => {
        return Promise.resolve(mockArtwork)
      },
      exchangeRatesLoader: () => {
        return Promise.resolve({
          EUR: 5.0,
        })
      },
    }
  }

  it("converts an exact price from native currency to USD dollars", async () => {
    const context = mockArtworkContext({
      id: "some-european-artwork",
      price_currency: "EUR",
      price_cents: [1000],
    })

    const query = gql`
      {
        artwork(id: "some-european-artwork") {
          listPrice {
            ... on Money {
              original: major
              converted: major(convertTo: "USD")
            }
          }
        }
      }
    `

    const result = await runQuery(query, context)
    expect(result!.artwork.listPrice).toEqual({
      original: 10,
      converted: 2,
    })
  })

  it("converts a price range from native currency to USD dollars", async () => {
    const context = mockArtworkContext({
      id: "some-european-artwork",
      price_currency: "EUR",
      price_cents: [1000, 2000],
    })

    const query = gql`
      {
        artwork(id: "some-european-artwork") {
          listPrice {
            ... on PriceRange {
              minPrice {
                original: major
                converted: major(convertTo: "USD")
              }
              maxPrice {
                original: major
                converted: major(convertTo: "USD")
              }
            }
          }
        }
      }
    `

    const result = await runQuery(query, context)
    expect(result!.artwork.listPrice.minPrice).toEqual({
      original: 10,
      converted: 2,
    })
    expect(result!.artwork.listPrice.maxPrice).toEqual({
      original: 20,
      converted: 4,
    })
  })

  // eslint-disable-next-line jest/no-disabled-tests
  it.skip("only supports USD", async () => {
    expect.assertions(1)

    const context = mockArtworkContext({
      id: "some-european-artwork",
      price_currency: "EUR",
      price_cents: [1000],
    })

    const query = gql`
      {
        artwork(id: "some-european-artwork") {
          listPrice {
            ... on Money {
              major(convertTo: "CAD")
            }
          }
        }
      }
    `

    await expect(runQuery(query, context)).rejects.toThrowError(/Only USD/)
  })

  it("returns null for missing prices", async () => {
    const context = mockArtworkContext({
      id: "some-european-artwork",
      price_currency: "EUR",
      price_cents: null,
    })

    const query = gql`
      {
        artwork(id: "some-european-artwork") {
          listPrice {
            ... on Money {
              major(convertTo: "USD")
            }
            ... on PriceRange {
              minPrice {
                major(convertTo: "USD")
              }
              maxPrice {
                major(convertTo: "USD")
              }
            }
          }
        }
      }
    `

    const result = await runQuery(query, context)
    expect(result!.artwork.listPrice).toBeNull()
  })

  it("truncates returned dollar value to cents (two decimal places) precision", async () => {
    const context = mockArtworkContext({
      id: "some-european-artwork",
      price_currency: "EUR",
      price_cents: [1234.56],
    })

    const query = gql`
      {
        artwork(id: "some-european-artwork") {
          listPrice {
            ... on Money {
              major(convertTo: "USD")
            }
          }
        }
      }
    `

    const result = await runQuery(query, context)
    const expectedPriceAfterConversion = 2.47 // i.e. not 2.4691199...
    expect(result!.artwork.listPrice.major).toEqual(
      expectedPriceAfterConversion
    )
  })
})

describe("resolvePriceAndCurrencyFieldsToMoney()", () => {
  const args = {}
  const ctx = { exchangeRatesLoader: jest.fn(() => Promise.resolve()) }
  const info = {}
  it("returns money fields for major + currencyCode", async () => {
    const result = await resolvePriceAndCurrencyFieldsToMoney(
      {
        major: 1234,
        currencyCode: "USD",
      },
      args,
      ctx,
      info
    )
    expect(result).toEqual({
      cents: 123400,
      major: 1234,
      display: "US$1,234",
      currency: "USD",
    })
  })

  it("returns money fields for minor + currencyCode", async () => {
    const result = await resolvePriceAndCurrencyFieldsToMoney(
      {
        minor: 123400,
        currencyCode: "USD",
      },
      args,
      ctx,
      info
    )

    expect(result).toEqual({
      cents: 123400,
      major: 1234,
      display: "US$1,234",
      currency: "USD",
    })
  })
})
