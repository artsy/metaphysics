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
      total_count: 1,
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
          },
        ],
      },
    }

    rootValue = {
      artistLoader: sinon
        .stub()
        .withArgs(artist.id)
        .returns(Promise.resolve(artist)),
      auctionLotLoader: sinon.stub().returns(Promise.resolve(auctionResultResponse)),
    }
  })

  it("returns auction results for an artist", () => {
    const query = `
      {
        artist(id: "percy-z") {
          auctionResults(first: 1) {
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
                },
              },
            ],
          },
        },
      })
    })
  })
})
