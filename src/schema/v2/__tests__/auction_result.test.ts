/* eslint-disable promise/always-return */
import { runQuery } from "schema/v2/test/utils"

const mockAuctionResult = {
  id: "foo-bar",
  sale_date_text: "10-12-2020",
  sale_title: "sale-title",
  title: "title",
  dimension_text: "20 x 20",
  organization: "Christie's",
  category_text: "an old guitar",
  sale_date: "yesterday",
  images: [
    {
      thumbnail: "https://path.to.thumbnail.jpg",
      larger: "https://path.to.larger.jpg",
    },
  ],
  currency: "EUR",
  location: "Berlin",
  price_realized_cents: 100000,
  price_realized_cents_usd: 200000,
  hammer_price_cents: 100000,
  low_estimate_cents: 100000,
  high_estimate_cents: 300000,
  price_realized: {
    cents: 200000,
    centsUSD: 200000,
  },
}

describe("AuctionResult type", () => {
  it("fetches an auctionResult by ID", () => {
    const query = `
    {
      auctionResult(id: "foo-bar") {
        currency
        saleDateText
        location
        performance {
          mid
        }
        estimate {
          display
        }
      }
    }
    `

    const context = {
      auctionLotLoader: jest.fn(() => Promise.resolve(mockAuctionResult)),
    }

    return runQuery(query, context!).then((data) => {
      expect(data.auctionResult).toEqual({
        currency: "EUR",
        saleDateText: "10-12-2020",
        location: "Berlin",
        performance: {
          mid: "-50%",
        },
        estimate: {
          display: "€1,000 – 3,000",
        },
      })
    })
  })

  describe("returns the right price display", () => {
    const query = `
      {
        auctionResult(id: "foo-bar") {
          estimate {
            display
          }
          priceRealized {
            display
          }
        }
      }
    `
    it("when the currency is supported and is part of symbolOnly array", () => {
      const auctionWithSupprotedCurrency = {
        ...mockAuctionResult,
        currency: "EUR",
      }

      const context = {
        auctionLotLoader: jest.fn(() =>
          Promise.resolve(auctionWithSupprotedCurrency)
        ),
      }

      return runQuery(query, context!).then((data) => {
        expect(data.auctionResult).toEqual({
          estimate: {
            display: "€1,000 – 3,000",
          },
          priceRealized: {
            display: "€1,000",
          },
        })
      })
    })

    it("when the currency is supported but not part of symbolOnly array", () => {
      const auctionWithSupprotedCurrency = {
        ...mockAuctionResult,
        currency: "HKD",
      }

      const context = {
        auctionLotLoader: jest.fn(() =>
          Promise.resolve(auctionWithSupprotedCurrency)
        ),
      }

      return runQuery(query, context!).then((data) => {
        expect(data.auctionResult).toEqual({
          estimate: {
            display: "HKD $1,000 – 3,000",
          },
          priceRealized: {
            display: "HKD $1,000",
          },
        })
      })
    })

    it("when the currency is not supported", () => {
      const auctionWithNoSupprotedCurrency = {
        ...mockAuctionResult,
        currency: "FRF",
      }

      const context = {
        auctionLotLoader: jest.fn(() =>
          Promise.resolve(auctionWithNoSupprotedCurrency)
        ),
      }

      return runQuery(query, context!).then((data) => {
        expect(data.auctionResult).toEqual({
          estimate: {
            display: null,
          },
          priceRealized: {
            display: null,
          },
        })
      })
    })
  })
})
