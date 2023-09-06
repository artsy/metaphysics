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
  sale_date: "2022-01-19T20:00:00.000Z",
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
          display: "€1,000–€3,000",
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
            display: "€1,000–€3,000",
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
            display: "HK$1,000–HK$3,000",
          },
          priceRealized: {
            display: "HK$1,000",
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

  describe("isUpcoming", () => {
    it("returns true when the sale date is in the future", () => {
      const auctionResult = {
        ...mockAuctionResult,
        sale_date: "2050-01-19T20:00:00.000Z",
      }

      const context = {
        auctionLotLoader: jest.fn(() => Promise.resolve(auctionResult)),
      }

      const query = `
        {
          auctionResult(id: "foo-bar") {
            isUpcoming
          }
        }
      `

      return runQuery(query, context!).then((data) => {
        expect(data.auctionResult.isUpcoming).toEqual(true)
      })
    })
    it("returns false when the sale date is in the past", () => {
      const auctionResult = {
        ...mockAuctionResult,
        sale_date: "2000-01-19T20:00:00.000Z",
      }

      const context = {
        auctionLotLoader: jest.fn(() => Promise.resolve(auctionResult)),
      }

      const query = `
          {
            auctionResult(id: "foo-bar") {
              isUpcoming
            }
          }
        `

      return runQuery(query, context!).then((data) => {
        expect(data.auctionResult.isUpcoming).toEqual(false)
      })
    })
  })

  describe("lotNumber", () => {
    it("returns the lot number when it is present", () => {
      const auctionResult = {
        ...mockAuctionResult,
        lot_number: "123",
      }

      const context = {
        auctionLotLoader: jest.fn(() => Promise.resolve(auctionResult)),
      }

      const query = `
        {
          auctionResult(id: "foo-bar") {
            lotNumber
          }
        }
      `

      return runQuery(query, context).then((data) => {
        expect(data.auctionResult.lotNumber).toEqual("123")
      })
    })

    it("returns null when the lot number is not present", () => {
      const auctionResult = {
        ...mockAuctionResult,
        lot_number: null,
      }

      const context = {
        auctionLotLoader: jest.fn(() => Promise.resolve(auctionResult)),
      }

      const query = `
          {
            auctionResult(id: "foo-bar") {
              lotNumber
            }
          }
        `

      return runQuery(query, context).then((data) => {
        expect(data.auctionResult.lotNumber).toEqual(null)
      })
    })
  })

  describe("isInArtsyAuction", () => {
    it("returns true when an auction is an Artsy auction", () => {
      const auctionResult = {
        ...mockAuctionResult,
        organization: "Artsy Auction",
      }

      const context = {
        auctionLotLoader: jest.fn(() => Promise.resolve(auctionResult)),
      }

      const query = `
        {
          auctionResult(id: "foo-bar") {
            isInArtsyAuction
          }
        }
      `

      return runQuery(query, context).then((data) => {
        expect(data.auctionResult.isInArtsyAuction).toEqual(true)
      })
    })

    it("returns false when an auction is not an Artsy auction", () => {
      const auctionResult = {
        ...mockAuctionResult,
        organization: "Sotheby's",
      }

      const context = {
        auctionLotLoader: jest.fn(() => Promise.resolve(auctionResult)),
      }

      const query = `
        {
          auctionResult(id: "foo-bar") {
            isInArtsyAuction
          }
        }
      `

      return runQuery(query, context).then((data) => {
        expect(data.auctionResult.isInArtsyAuction).toEqual(false)
      })
    })
  })

  describe("artist", () => {
    it("returns the artist name when requested", () => {
      const auctionResult = {
        ...mockAuctionResult,
      }

      const context = {
        auctionLotLoader: jest.fn(() => Promise.resolve(auctionResult)),
        artistLoader: jest.fn(() => Promise.resolve({ name: "Andy Warhol" })),
      }

      const query = `
        {
          auctionResult(id: "foo-bar") {
            artist {
              name
            }
          }
        }
      `

      return runQuery(query, context).then((data) => {
        expect(data.auctionResult.artist.name).toEqual("Andy Warhol")
      })
    })
  })

  describe("slug", () => {
    it("returns the slug", () => {
      const auctionResult = {
        ...mockAuctionResult,
        slug: "artist-title",
      }

      const context = {
        auctionLotLoader: jest.fn(() => Promise.resolve(auctionResult)),
      }

      const query = `
        {
          auctionResult(id: "foo-bar") {
            slug
          }
        }
      `

      return runQuery(query, context).then((data) => {
        expect(data.auctionResult.slug).toEqual("artist-title")
      })
    })
  })
})

const mockComparableAuctionResults = {
  total_count: 2,
  _embedded: {
    items: [
      {
        sale_date_text: "10-12-2020",
        currency: "EUR",
        images: [
          {
            thumbnail: {
              image_url: "https://path.to.1.jpg",
            },
          },
        ],
      },
      {
        sale_date_text: "10-10-2021",
        currency: "EUR",
        images: [
          {
            thumbnail: {
              image_url: "https://path.to.2.jpg",
            },
          },
        ],
      },
    ],
  },
}
const mockEmptyComparableAuctionResults = {
  error: "Lot not comparable",
}

describe("Comparable Auction Results", () => {
  it("fetches comparable auction results", () => {
    const query = `
    {
      auctionResult(id: "foo-bar") {
        saleDateText
        saleTitle
        comparableAuctionResults(first:25) {
          totalCount
          edges {
            node {
              saleDateText
              currency
              images {
                thumbnail {
                  imageURL
                }
              }
            }
          }
        }
      }
    }
    `

    const context = {
      auctionLotLoader: jest.fn(() => Promise.resolve(mockAuctionResult)),
      auctionResultComparableAuctionResultsLoader: jest.fn(() =>
        Promise.resolve(mockComparableAuctionResults)
      ),
    }

    return runQuery(query, context!).then((data) => {
      expect(data.auctionResult.comparableAuctionResults).toEqual({
        totalCount: 2,
        edges: [
          {
            node: {
              saleDateText: "10-12-2020",
              currency: "EUR",
              images: {
                thumbnail: {
                  imageURL: "https://path.to.1.jpg",
                },
              },
            },
          },
          {
            node: {
              saleDateText: "10-10-2021",
              currency: "EUR",
              images: {
                thumbnail: {
                  imageURL: "https://path.to.2.jpg",
                },
              },
            },
          },
        ],
      })
    })
  })

  it("fetches not comparable auction results", () => {
    const query = `
    {
      auctionResult(id: "foo-bar") {
        saleDateText
        saleTitle
        comparableAuctionResults(first:25) {
          totalCount
          edges {
            node {
              saleDateText
              currency
              images {
                thumbnail {
                  imageURL
                }
              }
            }
          }
        }
      }
    }
    `

    const context = {
      auctionLotLoader: jest.fn(() => Promise.resolve(mockAuctionResult)),
      auctionResultComparableAuctionResultsLoader: jest.fn(() =>
        Promise.resolve(mockEmptyComparableAuctionResults)
      ),
    }

    return runQuery(query, context!).then((data) => {
      expect(data.auctionResult.comparableAuctionResults).toEqual(null)
    })
  })
})
