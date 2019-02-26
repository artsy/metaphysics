import { runQuery } from "test/utils"

describe("MarketingCollectionArtwork", () => {
  it.skip("sets keyword_match_exact to true when keywords are set", async () => {
    const query = `
      {
        marketingCollection(slug: "kaws-snoopy") {
          slug
          query {
            keyword
          }
          artworks {
            hits {
              title
            }
          }
        }
      }
    `
    const context = {
      filterArtworksLoader: jest.fn(() => Promise.resolve()),
    }

    await runQuery(query, context)
    expect(context.filterArtworksLoader.mock.calls[0]).toMatchInlineSnapshot(`
Array [
  Object {
    "aggregations": Array [],
    "artist_ids": Array [
      "4e934002e340fa0001005336",
    ],
    "gene_ids": Array [],
    "keyword": "Snoopy, Woodstock, Man’s Best Friend, No One's Home, Isolation Tower, Stay Steady, The Things that Comfort",
    "keyword_match_exact": true,
  },
]
`)
  })

  it.skip("sets keyword_match_exact to false when keywords are not set", async () => {
    const query = `
      {
        marketingCollection(slug: "alexander-calder-mobiles") {
          slug
          query {
            keyword
          }
          artworks {
            hits {
              title
            }
          }
        }
      }
    `

    const context = {
      filterArtworksLoader: jest.fn(() => Promise.resolve()),
    }

    await runQuery(query, context)
    expect(context.filterArtworksLoader.mock.calls[0]).toMatchInlineSnapshot(`
Array [
  Object {
    "aggregations": Array [],
    "artist_ids": Array [
      "4dde70a1306f6800010036ef",
    ],
    "gene_ids": Array [
      "kinetic-sculpture",
    ],
    "keyword_match_exact": false,
  },
]
`)
  })
})
