// TODO: Switch to v2
import { runQuery } from "schema/v1/test/utils"

// TODO: The tests in this file make _actual_ requests to KAWS.
xdescribe("MarketingCollectionArtwork", () => {
  let context
  let mockFilterArtworksLoader

  beforeEach(() => {
    mockFilterArtworksLoader = jest
      .fn()
      .mockImplementation(() => Promise.resolve())
    context = {
      authenticatedLoaders: {},
      unauthenticatedLoaders: {
        filterArtworksLoader: mockFilterArtworksLoader,
      },
    }
  })

  afterEach(() => {
    mockFilterArtworksLoader.mockReset()
  })

  it("sets keyword_match_exact to true when keywords are set", async () => {
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

    await runQuery(query, context)
    expect(mockFilterArtworksLoader.mock.calls[0]).toMatchInlineSnapshot(`
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
  Object {
    "requestThrottleMs": 3600000,
  },
]
`)
  })

  it("sets keyword_match_exact to false when keywords are not set", async () => {
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

    await runQuery(query, context)
    expect(mockFilterArtworksLoader.mock.calls[0]).toMatchInlineSnapshot(`
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
  Object {
    "requestThrottleMs": 3600000,
  },
]
`)
  })
})
