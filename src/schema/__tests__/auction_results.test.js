/* eslint-disable promise/always-return */
import { runQuery } from "test/utils"

describe("Artist type", () => {
  let artist = null
  let rootValue = null

  beforeEach(() => {
    artist = {
      id: "percy-z",
      birthday: "2005",
      artworks_count: 42,
      _id: "4d8b92b34eb68a1b2c0003f4",
    }

    const auctionResultResponse = {
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
          },
        ],
      },
    }

    rootValue = {
      artistLoader: sinon
        .stub()
        .withArgs(artist.id)
        .returns(Promise.resolve(artist)),
      auctionLotLoader: sinon
        .stub()
        .returns(Promise.resolve(auctionResultResponse)),
    }
  })

  it("returns auction results for an artist", () => {
    const query = `
      {
        artist(id: "percy-z") {
          auctionResults(recordsTrusted: true, first: 1) {
            edges {
              node {
                category_text
                images {
                  thumbnail {
                    image_url
                  }
                  larger {
                    image_url
                  }
                }
                currency
                price_realized {
                  display(format: "0a")
                  cents
                  cents_usd
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

    return runQuery(query, rootValue).then(data => {
      expect(data).toEqual({
        artist: {
          auctionResults: {
            edges: [
              {
                node: {
                  category_text: "an old guitar",
                  images: {
                    thumbnail: {
                      image_url: "https://path.to.thumbnail.jpg",
                    },
                    larger: {
                      image_url: "https://path.to.larger.jpg",
                    },
                  },
                  currency: "JPY",
                  price_realized: {
                    cents: 420000,
                    cents_usd: 100000,
                    display: "JPY ¥420k",
                  },
                  estimate: {
                    display: "JPY ¥200,000 - 500,000",
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
          auctionResults(recordsTrusted: true, first: 10) {
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
                id
              }
            }
          }
        }
      }
    `

    return runQuery(query, rootValue).then(
      ({
        artist: {
          auctionResults: { pageCursors, edges },
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
        expect(edges[0].node.id).toEqual("1")
      }
    )
  })

  it("returns correct page info", () => {
    const query = `
      {
        artist(id: "percy-z") {
          auctionResults(recordsTrusted: true, first: 10, after: "YXJyYXljb25uZWN0aW9uOjk=") {
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

    return runQuery(query, rootValue).then(
      ({
        artist: {
          auctionResults: {
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
          auctionResults(recordsTrusted: true, first: 10) {
            totalCount
          }
        }
      }
    `

    return runQuery(query, rootValue).then(
      ({
        artist: {
          auctionResults: { totalCount },
        },
      }) => {
        expect(totalCount).toBe(35)
      }
    )
  })
})
