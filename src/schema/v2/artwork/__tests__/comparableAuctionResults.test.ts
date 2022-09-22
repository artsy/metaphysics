import { runQuery } from "schema/v2/test/utils"

describe("ComparableAuctionResults", () => {
  const artworkLoader = jest.fn(async () => mockArtwork)
  const comparableAuctionResultsLoader = jest.fn(
    async () => mockComparableAuctionResults
  )

  const context = {
    artworkLoader,
    comparableAuctionResultsLoader,
  }

  const query = `
      {
        artwork(id: "joan-miro-miro-milano-2") {
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

  it("fetches comparable auction results", async () => {
    const {
      artwork: { comparableAuctionResults },
    } = await runQuery(query, context)

    expect(artworkLoader).toHaveBeenCalledWith(mockArtwork.id)
    expect(comparableAuctionResultsLoader).toHaveBeenCalledWith({
      artist_id: mockArtwork.artist._id,
      date: mockArtwork.date,
      height_cm: mockArtwork.height_cm,
      width_cm: mockArtwork.width_cm,
      depth_cm: mockArtwork.depth_cm,
      diameter_cm: mockArtwork.diameter_cm,
    })

    expect(comparableAuctionResults).toMatchInlineSnapshot(`
      Object {
        "edges": Array [
          Object {
            "node": Object {
              "currency": "EUR",
              "images": Object {
                "thumbnail": Object {
                  "imageURL": "https://path.to.1.jpg",
                },
              },
              "saleDateText": "10-12-2020",
            },
          },
          Object {
            "node": Object {
              "currency": "EUR",
              "images": Object {
                "thumbnail": Object {
                  "imageURL": "https://path.to.2.jpg",
                },
              },
              "saleDateText": "10-10-2021",
            },
          },
        ],
        "totalCount": 2,
      }
    `)
  })
})

const mockArtwork = {
  id: "joan-miro-miro-milano-2",
  artist: { _id: "an-artist-id", id: "artist-id" },
  date: "2019",
  height_cm: "height_cm",
  width_cm: "width_cm",
  depth_cm: "depth_cm",
  diameter_cm: "diameter_cm",
  price_realized_cents_usd: "price_realized_cents_usd",
  low_estimate_cents_usd: "low_estimate_cents_usd",
  high_estimate_cents_usd: "high_estimate_cents_usd",
}

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
