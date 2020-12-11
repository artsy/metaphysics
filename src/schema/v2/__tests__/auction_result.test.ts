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
  priceRealized_cents: 420000,
  priceRealized_cents_usd: 100000,
  low_estimate_cents: 200000,
  high_estimate_cents: 500000,
  price_realized: {
    cents: 420000,
    centsUSD: 100000,
    display: "JPY ¥420k",
  },
  estimate: {
    display: "JPY ¥200,000 - 500,000",
  },
}

describe("AuctionResult type", () => {
  it("fetches an auctionResult by ID", () => {
    const query = `
      {
        auctionResult(id: "foo-bar") {
          currency
          saleDateText
        }
      }
    `

    const context = {
      auctionLotLoader: jest.fn(() => Promise.resolve(mockAuctionResult)),
    }

    return runQuery(query, context!).then((data) => {
      expect(data.auctionResult.currency).toBe("EUR")
      expect(data.auctionResult.saleDateText).toEqual("10-12-2020")
    })
  })
})
