import { amount } from "../money"
import { runQuery } from "schema/v2/test/utils"
import gql from "lib/gql"

describe(amount, () => {
  const getResult = ({
    obj = {},
    args = { symbol: "$" } as object,
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

  it("prefers object symbol over currencyCode", () => {
    expect(
      getResult({
        obj: { symbol: "$", currencyCode: "GBP" },
        args: {},
      })
    ).toMatchInlineSnapshot(`"$12.34"`)
  })

  it("prefers argument symbol over currencyCode", () => {
    expect(
      getResult({
        obj: { symbol: "£", currencyCode: "GBP" },
      })
    ).toMatchInlineSnapshot(`"$12.34"`)
  })

  it("doesn't break when it can't find a currencyCode", () => {
    expect(getResult({ obj: { currencyCode: "BLAH" } })).toMatchInlineSnapshot(
      `"$12.34"`
    )
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

  it("converts an exact price from native currency to USD dollars", () => {
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

    return runQuery(query, context).then((result) => {
      expect(result!.artwork.listPrice).toEqual({
        original: 10.0,
        converted: 2.0,
      })
    })
  })

  it("converts a price range from native currency to USD dollars", () => {
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

    return runQuery(query, context).then((result) => {
      expect(result!.artwork.listPrice.minPrice).toEqual({
        original: 10.0,
        converted: 2.0,
      })
      expect(result!.artwork.listPrice.maxPrice).toEqual({
        original: 20.0,
        converted: 4.0,
      })
    })
  })

  xit("only supports USD", () => {
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

    expect(runQuery(query, context)).rejects.toThrowError(/Only USD/)
  })

  it("returns null for missing prices", () => {
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

    return runQuery(query, context).then((result) => {
      expect(result!.artwork.listPrice).toBeNull()
    })
  })

  it("truncates returned dollar value to cents (two decimal places) precision", () => {
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

    return runQuery(query, context).then((result) => {
      const expectedPriceAfterConversion = 2.47 // i.e. not 2.4691199...
      expect(result!.artwork.listPrice.major).toEqual(
        expectedPriceAfterConversion
      )
    })
  })
})
