import gql from "lib/gql"
import { runAuthenticatedQuery } from "schema/v2/test/utils"
import { ResolverContext } from "types/graphql"

describe("me.myCollectionInfo", () => {
  it("includes info about my collection", async () => {
    const query = gql`
      {
        me {
          myCollectionInfo {
            name
            includesPurchasedArtworks
            artworksCount
            artistsCount
          }
        }
      }
    `
    const context: Partial<ResolverContext> = {
      meLoader: async () => ({
        id: "some-user-id",
      }),
      collectionLoader: async () => ({
        name: "My Collection",
        includes_purchased_artworks: true,
        artworks_count: 20,
        artists_count: 2,
      }),
    }

    const data = await runAuthenticatedQuery(query, context)

    expect(data.me.myCollectionInfo).toMatchInlineSnapshot(`
      {
        "artistsCount": 2,
        "artworksCount": 20,
        "includesPurchasedArtworks": true,
        "name": "My Collection",
      }
    `)
  })

  describe("artistInsightsCount", () => {
    it("returns the correct count", async () => {
      const query = gql`
        {
          me {
            myCollectionInfo {
              artistInsightsCount {
                activeSecondaryMarketCount
                biennialCount
                groupShowCount
                collectedCount
                soloShowCount
                reviewedCount
              }
            }
          }
        }
      `

      const context: Partial<ResolverContext> = {
        collectionLoader: async () => ({}),
        meLoader: async () => ({ id: "some-user-id" }),
        collectionArtistsLoader: async () => ({
          headers: {},
          body: [
            {
              name: "Artist 1",
              collected_by_institutions_count: 10,
              review_sources: "Reviewed by a major art publication",
              artworks_count_within_collection: 3,
            },
            {
              name: "Artist 2",
              group_shows_count: 1,
              review_sources: "Reviewed by a major art publication",
              solo_shows_count: 2,
            },
            {
              name: "Artist 3",
              active_secondary_market: "Active Secondary Market",
              biennials: "Included in a major biennial",
              collected_by_institutions_count: 1,
            },
            {
              name: "Artist 4",
              active_secondary_market: "Active Secondary Market",
              collected_by_institutions_count: 1,
            },
          ],
        }),
      }

      const data = await runAuthenticatedQuery(query, context)
      const {
        activeSecondaryMarketCount,
        biennialCount,
        collectedCount,
        groupShowCount,
        soloShowCount,
        reviewedCount,
      } = data.me.myCollectionInfo.artistInsightsCount

      expect(activeSecondaryMarketCount).toBe(2)
      expect(biennialCount).toBe(1)
      expect(groupShowCount).toBe(1)
      expect(collectedCount).toBe(3)
      expect(reviewedCount).toBe(2)
      expect(soloShowCount).toBe(1)

      expect(data).toMatchInlineSnapshot(`
        {
          "me": {
            "myCollectionInfo": {
              "artistInsightsCount": {
                "activeSecondaryMarketCount": 2,
                "biennialCount": 1,
                "collectedCount": 3,
                "groupShowCount": 1,
                "reviewedCount": 2,
                "soloShowCount": 1,
              },
            },
          },
        }
      `)
    })
  })

  describe("artistInsights", () => {
    it("returns insights for all collected artist by kind", async () => {
      const query = gql`
        {
          me {
            myCollectionInfo {
              artistInsights(kind: COLLECTED) {
                artist {
                  name
                }
                kind
                type
                label
                entities
              }
            }
          }
        }
      `
      const artistCareerHighlightsLoader = jest.fn().mockResolvedValue(null)

      const context: Partial<ResolverContext> = {
        collectionLoader: async () => ({}),
        meLoader: async () => ({ id: "some-user-id" }),
        collectionArtistsLoader: async () => ({
          headers: { "x-total-count": "2" },
          body: [
            {
              name: "Artist 1",
              collections: "Collected by a major art publication",
            },
            {
              name: "Artist 2",
              reviewed: "Reviewed by a major art publication",
            },
          ],
        }),
        artistCareerHighlightsLoader: artistCareerHighlightsLoader,
      }

      artistCareerHighlightsLoader
        .mockResolvedValueOnce([{ venue: "MoMA PS1" }])
        .mockResolvedValueOnce(null)

      const data = await runAuthenticatedQuery(query, context)

      expect(data).toMatchInlineSnapshot(`
        {
          "me": {
            "myCollectionInfo": {
              "artistInsights": [
                {
                  "artist": {
                    "name": "Artist 1",
                  },
                  "entities": [
                    "MoMA PS1",
                  ],
                  "kind": "COLLECTED",
                  "label": "Collected by a major institution",
                  "type": "COLLECTED",
                },
              ],
            },
          },
        }
      `)
    })
  })

  describe("collectedArtistsConnection", () => {
    it("returns a connection for the artists in the users' collection", async () => {
      const query = gql`
        {
          me {
            myCollectionInfo {
              collectedArtistsConnection(first: 5) {
                totalCount
                edges {
                  artworksCount
                  node {
                    name
                  }
                }
              }
            }
          }
        }
      `

      const context: Partial<ResolverContext> = {
        collectionLoader: async () => ({}),
        meLoader: async () => ({
          id: "some-user-id",
        }),
        collectionArtistsLoader: async () => ({
          headers: { "x-total-count": "3" },
          body: [
            {
              name: "Artist 1",
              artworks_count_within_collection: 1,
            },
            {
              name: "Artist 2",
              artworks_count_within_collection: 2,
            },
            {
              name: "Artist 3",
              artworks_count_within_collection: 3,
            },
          ],
        }),
      }

      const data = await runAuthenticatedQuery(query, context)

      expect(data).toMatchInlineSnapshot(`
        {
          "me": {
            "myCollectionInfo": {
              "collectedArtistsConnection": {
                "edges": [
                  {
                    "artworksCount": 1,
                    "node": {
                      "name": "Artist 1",
                    },
                  },
                  {
                    "artworksCount": 2,
                    "node": {
                      "name": "Artist 2",
                    },
                  },
                  {
                    "artworksCount": 3,
                    "node": {
                      "name": "Artist 3",
                    },
                  },
                ],
                "totalCount": 3,
              },
            },
          },
        }
      `)

      expect(data.me.myCollectionInfo.collectedArtistsConnection)
        .toMatchInlineSnapshot(`
        {
          "edges": [
            {
              "artworksCount": 1,
              "node": {
                "name": "Artist 1",
              },
            },
            {
              "artworksCount": 2,
              "node": {
                "name": "Artist 2",
              },
            },
            {
              "artworksCount": 3,
              "node": {
                "name": "Artist 3",
              },
            },
          ],
          "totalCount": 3,
        }
      `)
    })
  })
})
