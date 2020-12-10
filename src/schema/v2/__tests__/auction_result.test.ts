/* eslint-disable promise/always-return */
import { runQuery } from "schema/v2/test/utils"

const mockAuctionResult = {
  id: "foo-bar",
  saleDateText: "10-12-2020",
  saleTitle: "sale-title",
  title: "title",
  dimensionText: "20 x 20",
  organization: "Christie's",
  categoryText: "an old guitar",
  saleDate: "yesterday",
  images: [
    {
      thumbnail: "https://path.to.thumbnail.jpg",
      larger: "https://path.to.larger.jpg",
    },
  ],
  currency: "EUR",
  priceRealized_cents: 420000,
  priceRealized_cents_usd: 100000,
  lowEstimateCents: 200000,
  highEstimateCents: 500000,
  priceRealized: {
    cents: 420000,
    centsUSD: 100000,
    display: "JPY ¥420k",
  },
  estimate: {
    display: "JPY ¥200,000 - 500,000",
  },
}

const auctionLotLoader = (_id: string) => Promise.resolve(mockAuctionResult)

describe.skip("AuctionResult type", () => {
  it("fetches an article by ID", async () => {
    const query = `
      {
        article(id: "foo-bar") {
          currency
          saleDateText
        }
      }
    `

    const data = await runQuery(query, { auctionLotLoader })
    expect(data).toEqual({
      auctionResult: {
        currency: "EUR",
        saleDateText: "10-12-2020",
      },
    })
  })
})
