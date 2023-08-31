/* eslint-disable promise/always-return */
import { runQuery } from "schema/v2/test/utils"

const artist = {
  id: "percy-z",
  birthday: "2005",
  artworks_count: 42,
  _id: "4d8b92b34eb68a1b2c0003f4",
}

const context = {
  artistLoader: jest.fn().mockReturnValue(Promise.resolve(artist)),
}

const auctionResultResponse = (item = {}) => {
  return {
    total_count: 35,
    _embedded: {
      items: [
        {
          dimension_text: "20 x 20",
          organization: "Christie's",
          category_text: "an old guitar",
          sale_date: "yesterday",
          id: "1",
          images: [
            {
              thumbnail: "https://path.to.thumbnail.jpg",
              larger: "https://path.to.larger.jpg",
            },
          ],
          currency: "JPY",
          price_realized_cents: 420000,
          price_realized_cents_usd: 100000,
          low_estimate_cents: 200000,
          high_estimate_cents: 500000,
          ...item,
        },
      ],
    },
  }
}

const simplePriceHistogramFilterResponse = {
  simple_price_histogram: {
    0: { name: "0", count: 10 },
    2000: { name: "2000", count: 20 },
  },
}

const currenciesCountFilterResponse = {
  currencies_count: {
    USD: { name: "USD", count: 101 },
    EUR: { name: "EUR", count: 202 },
  },
}

const lotsBySaleYearResponse = {
  lots_by_sale_year: {
    2020: { name: "2020", count: 5 },
    2022: { name: "2022", count: 10 },
  },
}

const lotsByCreatedYearResponse = {
  lots_by_created_year: {
    1900: { name: "1900", count: 5 },
    2022: { name: "2022", count: 10 },
    2023: { name: "2022", count: 15 },
  },
}

describe("Artist type", () => {
  beforeEach(() => {
    context.auctionLotsLoader = jest
      .fn()
      .mockReturnValueOnce(Promise.resolve(auctionResultResponse()))
  })

  it("returns auction results for an artist", () => {
    const query = `
      {
        artist(id: "percy-z") {
          auctionResultsConnection(recordsTrusted: true, first: 1) {
            edges {
              node {
                categoryText
                images {
                  thumbnail {
                    imageURL
                  }
                  larger {
                    imageURL
                  }
                }
                currency
                priceRealized {
                  display(format: "0a")
                  displayUSD(format: "0a")
                  cents
                  centsUSD
                }
                estimate {
                  display
                }
              }
            }
          }
        }
      }
    `

    return runQuery(query, context).then((data) => {
      expect(data).toEqual({
        artist: {
          auctionResultsConnection: {
            edges: [
              {
                node: {
                  categoryText: "an old guitar",
                  images: {
                    thumbnail: {
                      imageURL: "https://path.to.thumbnail.jpg",
                    },
                    larger: {
                      imageURL: "https://path.to.larger.jpg",
                    },
                  },
                  currency: "JPY",
                  priceRealized: {
                    cents: 420000,
                    centsUSD: 100000,
                    display: "JPY ¥420k",
                    displayUSD: "US$1k",
                  },
                  estimate: {
                    display: "JPY ¥200,000–¥500,000",
                  },
                },
              },
            ],
          },
        },
      })
    })
  })

  it("returns cursor info", () => {
    const query = `
      {
        artist(id: "percy-z") {
          auctionResultsConnection(recordsTrusted: true, first: 10) {
            pageCursors {
              first {
                page
              }
              around {
                page
              }
              last {
                page
              }
            }
            edges {
              node {
                internalID
              }
            }
          }
        }
      }
    `

    return runQuery(query, context).then(
      ({
        artist: {
          auctionResultsConnection: { pageCursors, edges },
        },
      }) => {
        // Check expected page cursors exist in response.
        const { first, around, last } = pageCursors
        expect(first).toEqual(null)
        expect(last).toEqual(null)
        expect(around.length).toEqual(4)
        let index
        for (index = 0; index < 4; index++) {
          expect(around[index].page).toBe(index + 1)
        }
        // Check auction result included in edges.
        expect(edges[0].node.internalID).toEqual("1")
      }
    )
  })

  it("returns aggregations", () => {
    context.auctionResultFilterLoader = jest
      .fn()
      .mockReturnValueOnce(Promise.resolve(simplePriceHistogramFilterResponse))

    const query = `
      {
        artist(id: "percy-z") {
          auctionResultsConnection(aggregations: [SIMPLE_PRICE_HISTOGRAM]) {
            aggregations {
              slice
              counts {
                name
                value
                count
              }
            }
          }
        }
      }
    `

    return runQuery(query, context).then(
      ({
        artist: {
          auctionResultsConnection: { aggregations },
        },
      }) => {
        expect(aggregations).toHaveLength(1)
        expect(aggregations[0].slice).toEqual("SIMPLE_PRICE_HISTOGRAM")
        expect(aggregations[0].counts).toHaveLength(2)
      }
    )
  })

  it("returns aggregated lot currencies", () => {
    context.auctionResultFilterLoader = jest
      .fn()
      .mockReturnValueOnce(Promise.resolve(currenciesCountFilterResponse))

    const query = `
      {
        artist(id: "percy-z") {
          auctionResultsConnection(aggregations: [CURRENCIES_COUNT]) {
            aggregations {
              slice
              counts {
                name
                value
                count
              }
            }
          }
        }
      }
    `

    return runQuery(query, context).then(
      ({
        artist: {
          auctionResultsConnection: { aggregations },
        },
      }) => {
        expect(aggregations).toHaveLength(1)
        expect(aggregations[0].slice).toEqual("CURRENCIES_COUNT")
        expect(aggregations[0].counts).toHaveLength(2)
      }
    )
  })

  it("returns aggregated lot sale_end_date counts", () => {
    context.auctionResultFilterLoader = jest
      .fn()
      .mockReturnValueOnce(Promise.resolve(lotsBySaleYearResponse))

    const query = `
      {
        artist(id: "percy-z") {
          auctionResultsConnection(aggregations: [LOTS_BY_SALE_YEAR]) {
            aggregations {
              slice
              counts {
                name
                value
                count
              }
            }
          }
        }
      }
    `

    return runQuery(query, context).then(
      ({
        artist: {
          auctionResultsConnection: { aggregations },
        },
      }) => {
        expect(aggregations).toHaveLength(1)
        expect(aggregations[0].slice).toEqual("LOTS_BY_SALE_YEAR")
        expect(aggregations[0].counts).toHaveLength(2)
      }
    )
  })

  it("returns aggregated lots by created year response", () => {
    context.auctionResultFilterLoader = jest
      .fn()
      .mockReturnValueOnce(Promise.resolve(lotsByCreatedYearResponse))

    const query = `
      {
        artist(id: "percy-z") {
          auctionResultsConnection(aggregations: [LOTS_BY_CREATED_YEAR]) {
            aggregations {
              slice
              counts {
                name
                value
                count
              }
            }
          }
        }
      }
    `

    return runQuery(query, context).then(
      ({
        artist: {
          auctionResultsConnection: { aggregations },
        },
      }) => {
        expect(aggregations).toHaveLength(1)
        expect(aggregations[0].slice).toEqual("LOTS_BY_CREATED_YEAR")
        expect(aggregations[0].counts).toHaveLength(3)
      }
    )
  })

  it("returns correct page info", () => {
    const query = `
      {
        artist(id: "percy-z") {
          auctionResultsConnection(recordsTrusted: true, first: 10, after: "YXJyYXljb25uZWN0aW9uOjk=") {
            pageInfo {
              hasNextPage
              hasPreviousPage
            }
            pageCursors {
              previous {
                page
              }
            }
          }
        }
      }
    `

    return runQuery(query, context).then(
      ({
        artist: {
          auctionResultsConnection: {
            pageCursors: {
              previous: { page },
            },
            pageInfo: { hasNextPage, hasPreviousPage },
          },
        },
      }) => {
        expect(hasNextPage).toBe(true)
        expect(hasPreviousPage).toBe(true)
        expect(page).toBe(1)
      }
    )
  })

  it("returns the total number of records", () => {
    const query = `
      {
        artist(id: "percy-z") {
          auctionResultsConnection(recordsTrusted: true, first: 10) {
            totalCount
          }
        }
      }
    `

    return runQuery(query, context).then(
      ({
        artist: {
          auctionResultsConnection: { totalCount },
        },
      }) => {
        expect(totalCount).toBe(35)
      }
    )
  })

  it("works with the downstream response lacking images", () => {
    const query = `
      {
        artist(id: "percy-z") {
          auctionResultsConnection(recordsTrusted: true, first: 1) {
            edges {
              node {
                internalID
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

    context.auctionLotsLoader = jest
      .fn()
      .mockReturnValueOnce(
        Promise.resolve(auctionResultResponse({ images: null }))
      )

    return runQuery(query, context).then((data) => {
      expect(data).toEqual({
        artist: {
          auctionResultsConnection: {
            edges: [
              {
                node: {
                  internalID: "1",
                  images: null,
                },
              },
            ],
          },
        },
      })
    })
  })

  describe("passes the correct arguments to the auctionLotsLoader", () => {
    describe("state", () => {
      const partialDefaultAuctionLotsArgs = {
        allow_empty_created_dates: true,
        allow_unspecified_prices: true,
        artist_id: "4d8b92b34eb68a1b2c0003f4",
        categories: undefined,
        earliest_created_year: undefined,
        include_estimate_range: false,
        keyword: undefined,
        latest_created_year: undefined,
        max_realized_price: undefined,
        min_realized_price: undefined,
        organizations: undefined,
        sale_start_year: undefined,
        sale_end_year: undefined,
        allow_unspecified_sale_dates: true,
        currency: undefined,
        page: 1,
        size: 1,
        sizes: undefined,
        sort: undefined,
        state: undefined,
      }

      it("is passed as all when note specified", async () => {
        const query = `
        {
          artist(id: "percy-z") {
            auctionResultsConnection(recordsTrusted: true, first: 1) {
              edges {
                node {
                  internalID
                }
              }
            }
          }
        }
      `

        context.auctionLotsLoader = jest
          .fn()
          .mockReturnValueOnce(Promise.resolve(auctionResultResponse()))

        const data = await runQuery(query, context)

        expect(context.auctionLotsLoader).toHaveBeenCalledWith({
          ...partialDefaultAuctionLotsArgs,
          state: "all",
        })

        expect(data).toEqual({
          artist: {
            auctionResultsConnection: {
              edges: [
                {
                  node: {
                    internalID: "1",
                  },
                },
              ],
            },
          },
        })
      })

      it("as all when passed as ALL", async () => {
        const query = `
        {
          artist(id: "percy-z") {
            auctionResultsConnection(recordsTrusted: true, first: 1, state: ALL) {
              edges {
                node {
                  internalID
                }
              }
            }
          }
        }
      `

        context.auctionLotsLoader = jest
          .fn()
          .mockReturnValueOnce(Promise.resolve(auctionResultResponse()))

        const data = await runQuery(query, context)

        expect(context.auctionLotsLoader).toHaveBeenCalledWith({
          ...partialDefaultAuctionLotsArgs,
          state: "all",
        })

        expect(data).toEqual({
          artist: {
            auctionResultsConnection: {
              edges: [
                {
                  node: {
                    internalID: "1",
                  },
                },
              ],
            },
          },
        })
      })

      it("as past when passed as PAST", async () => {
        const query = `
        {
          artist(id: "percy-z") {
            auctionResultsConnection(recordsTrusted: true, first: 1, state: PAST) {
              edges {
                node {
                  internalID
                }
              }
            }
          }
        }
      `

        context.auctionLotsLoader = jest
          .fn()
          .mockReturnValueOnce(Promise.resolve(auctionResultResponse()))

        const data = await runQuery(query, context)

        expect(context.auctionLotsLoader).toHaveBeenCalledWith({
          ...partialDefaultAuctionLotsArgs,
          state: "past",
        })

        expect(data).toEqual({
          artist: {
            auctionResultsConnection: {
              edges: [
                {
                  node: {
                    internalID: "1",
                  },
                },
              ],
            },
          },
        })
      })
      it("as upcoming when passed as UPCOMING", async () => {
        const query = `
        {
          artist(id: "percy-z") {
            auctionResultsConnection(recordsTrusted: true, first: 1, state: UPCOMING) {
              edges {
                node {
                  internalID
                }
              }
            }
          }
        }
      `

        context.auctionLotsLoader = jest
          .fn()
          .mockReturnValueOnce(Promise.resolve(auctionResultResponse()))

        const data = await runQuery(query, context)

        expect(context.auctionLotsLoader).toHaveBeenCalledWith({
          ...partialDefaultAuctionLotsArgs,
          state: "upcoming",
        })

        expect(data).toEqual({
          artist: {
            auctionResultsConnection: {
              edges: [
                {
                  node: {
                    internalID: "1",
                  },
                },
              ],
            },
          },
        })
      })
    })
  })

  describe("priceRealized", () => {
    function givenAnAuctionResultResponseWith(specs) {
      context.auctionLotsLoader = jest
        .fn()
        .mockReturnValueOnce(Promise.resolve(auctionResultResponse(specs)))
    }

    const query = `
      {
        artist(id: "percy-z") {
          auctionResultsConnection(recordsTrusted: true, first: 1) {
            edges {
              node {
                priceRealized {
                  display(format: "0a")
                  cents
                  centsUSD
                  displayUSD
                }
              }
            }
          }
        }
      }
    `

    it("returns 0 for all priceRealized fields when price is 0", () => {
      givenAnAuctionResultResponseWith({
        price_realized_cents: 0,
        price_realized_cents_usd: 0,
      })

      return runQuery(query, context).then((data) => {
        expect(data).toMatchObject({
          artist: {
            auctionResultsConnection: {
              edges: [
                {
                  node: {
                    priceRealized: {
                      display: "JPY ¥0",
                      cents: 0,
                      centsUSD: 0,
                      displayUSD: "US$0",
                    },
                  },
                },
              ],
            },
          },
        })
      })
    })

    it("returns null for all priceRealized fields when price is undefined", () => {
      givenAnAuctionResultResponseWith({
        price_realized_cents: undefined,
        price_realized_cents_usd: undefined,
      })

      return runQuery(query, context).then((data) => {
        expect(data).toMatchObject({
          artist: {
            auctionResultsConnection: {
              edges: [
                {
                  node: {
                    priceRealized: {
                      display: null,
                      cents: null,
                      centsUSD: null,
                    },
                  },
                },
              ],
            },
          },
        })
      })
    })
  })
})
