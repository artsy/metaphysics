/* eslint-disable promise/always-return */
import { runAuthenticatedQuery } from "schema/v2/test/utils"
import gql from "lib/gql"

describe("artistRecommendations", () => {
  const query = gql`
    {
      me {
        artistRecommendations(first: 100) {
          totalCount
          edges {
            node {
              internalID
              slug
            }
          }
        }
      }
    }
  `

  it("returns artist recommendations from Vortex", async () => {
    const vortexGraphQLAuthenticatedLoader = jest.fn(() => async () =>
      mockVortexResponse
    )
    const vortexGraphQLUnauthenticatedLoader = jest.fn(() => async () => [])

    const artistsLoader = jest.fn(async () => mockArtistsResponse)

    const context: any = {
      artistsLoader,
      meLoader: () => Promise.resolve({}),
      userID: "vortex-user-id",
      authenticatedLoaders: {
        vortexGraphqlLoader: vortexGraphQLAuthenticatedLoader,
      },
      unauthenticatedLoaders: {
        vortexGraphqlLoader: vortexGraphQLUnauthenticatedLoader,
      },
    }

    const {
      me: { artistRecommendations },
    } = await runAuthenticatedQuery(query, context)

    expect(artistRecommendations).toMatchInlineSnapshot(`
      {
        "edges": [
          {
            "node": {
              "internalID": "608a7416bdfbd1a789ba0911",
              "slug": "banksy",
            },
          },
          {
            "node": {
              "internalID": "608a7417bdfbd1a789ba092a",
              "slug": "1-plus-1-plus-1",
            },
          },
        ],
        "totalCount": 2,
      }
    `)

    expect(vortexGraphQLAuthenticatedLoader).toHaveBeenCalledWith({
      query: gql`
        query artistRecommendationsQuery {
          artistRecommendations(first: 50, userId: "vortex-user-id") {
            totalCount
            edges {
              node {
                artistId
                score
              }
            }
          }
        }
      `,
    })
    expect(artistsLoader).toHaveBeenCalledWith({
      ids: ["608a7416bdfbd1a789ba0911", "608a7417bdfbd1a789ba092a"],
    })
  })

  it("doesn't return artists if no artist recommendations are present", async () => {
    const vortexGraphqlLoader = jest.fn(() => async () => ({
      data: {
        artistRecommendations: {
          edges: [],
          totalCount: 0,
        },
      },
    }))

    const artistsLoader = jest.fn(async () => mockArtistsResponse)

    const context: any = {
      artistsLoader,
      meLoader: () => Promise.resolve({}),
      authenticatedLoaders: {
        vortexGraphqlLoader,
      },
      unauthenticatedLoaders: {
        vortexGraphqlLoader: null,
      },
    }

    const {
      me: { artistRecommendations },
    } = await runAuthenticatedQuery(query, context)

    expect(artistRecommendations).toMatchInlineSnapshot(`
      {
        "edges": [],
        "totalCount": 0,
      }
    `)

    expect(vortexGraphqlLoader).toHaveBeenCalled()
    expect(artistsLoader).not.toHaveBeenCalled()
  })

  it("prefers non authenticated vortex loader", async () => {
    const vortexGraphQLUnauthenticatedLoader = jest.fn(() => async () =>
      mockVortexResponse
    )

    const artistsLoader = jest.fn(async () => mockArtistsResponse)

    const context: any = {
      artistsLoader,
      authenticatedLoaders: {
        vortexGraphqlLoader: () => ({}),
      },
      unauthenticatedLoaders: {
        vortexGraphqlLoader: vortexGraphQLUnauthenticatedLoader,
      },
      userID: "impersonated-user-id",
      xImpersonateUserID: "impersonated-user-id",
    }

    const {
      me: { artistRecommendations },
    } = await runAuthenticatedQuery(query, context)

    expect(artistRecommendations).toMatchInlineSnapshot(`
      {
        "edges": [
          {
            "node": {
              "internalID": "608a7416bdfbd1a789ba0911",
              "slug": "banksy",
            },
          },
          {
            "node": {
              "internalID": "608a7417bdfbd1a789ba092a",
              "slug": "1-plus-1-plus-1",
            },
          },
        ],
        "totalCount": 2,
      }
    `)

    expect(vortexGraphQLUnauthenticatedLoader).toHaveBeenCalledWith({
      query: gql`
        query artistRecommendationsQuery {
          artistRecommendations(first: 50, userId: "impersonated-user-id") {
            totalCount
            edges {
              node {
                artistId
                score
              }
            }
          }
        }
      `,
    })
  })

  describe("SIMILAR_TO_FOLLOWED source", () => {
    const similarToFollowedQuery = gql`
      {
        me {
          artistRecommendations(first: 10, source: SIMILAR_TO_FOLLOWED) {
            totalCount
            edges {
              node {
                internalID
                slug
              }
            }
          }
        }
      }
    `

    it("returns artist recommendations from similar to followed artists", async () => {
      const suggestedSimilarArtistsLoader = jest.fn(async () => ({
        body: [
          { artist: mockArtistsResponse.body[0] },
          { artist: mockArtistsResponse.body[1] },
        ],
      }))

      const context: any = {
        suggestedSimilarArtistsLoader,
        meLoader: () => Promise.resolve({}),
      }

      const {
        me: { artistRecommendations },
      } = await runAuthenticatedQuery(similarToFollowedQuery, context)

      expect(artistRecommendations).toMatchInlineSnapshot(`
        {
          "edges": [
            {
              "node": {
                "internalID": "608a7416bdfbd1a789ba0911",
                "slug": "banksy",
              },
            },
            {
              "node": {
                "internalID": "608a7417bdfbd1a789ba092a",
                "slug": "1-plus-1-plus-1",
              },
            },
          ],
          "totalCount": 2,
        }
      `)

      expect(suggestedSimilarArtistsLoader).toHaveBeenCalledWith({
        size: 10,
        page: 1,
        exclude_followed_artists: true,
        exclude_artists_without_forsale_artworks: true,
      })
    })

    it("throws error when access token is missing", async () => {
      const context: any = {
        suggestedSimilarArtistsLoader: null,
        meLoader: () => Promise.resolve({}),
      }

      await expect(
        runAuthenticatedQuery(similarToFollowedQuery, context)
      ).rejects.toThrow(
        "A X-Access-Token header is required to perform this action."
      )
    })

    it("handles empty response from suggested similar artists loader", async () => {
      const suggestedSimilarArtistsLoader = jest.fn(async () => ({
        body: [],
      }))

      const context: any = {
        suggestedSimilarArtistsLoader,
        meLoader: () => Promise.resolve({}),
      }

      const {
        me: { artistRecommendations },
      } = await runAuthenticatedQuery(similarToFollowedQuery, context)

      expect(artistRecommendations).toMatchInlineSnapshot(`
        {
          "edges": [],
          "totalCount": 0,
        }
      `)
    })

    it("handles null response from suggested similar artists loader", async () => {
      const suggestedSimilarArtistsLoader = jest.fn(async () => ({
        body: null,
      }))

      const context: any = {
        suggestedSimilarArtistsLoader,
        meLoader: () => Promise.resolve({}),
      }

      const {
        me: { artistRecommendations },
      } = await runAuthenticatedQuery(similarToFollowedQuery, context)

      expect(artistRecommendations).toMatchInlineSnapshot(`
        {
          "edges": [],
          "totalCount": 0,
        }
      `)
    })
  })

  describe("pagination", () => {
    it("respects the first argument for hybrid recommendations", async () => {
      const paginatedQuery = gql`
        {
          me {
            artistRecommendations(first: 1) {
              totalCount
              edges {
                node {
                  internalID
                  slug
                }
              }
            }
          }
        }
      `

      const vortexGraphQLAuthenticatedLoader = jest.fn(() => async () =>
        mockVortexResponse
      )

      const artistsLoader = jest.fn(async () => mockArtistsResponse)

      const context: any = {
        artistsLoader,
        meLoader: () => Promise.resolve({}),
        userID: "vortex-user-id",
        authenticatedLoaders: {
          vortexGraphqlLoader: vortexGraphQLAuthenticatedLoader,
        },
        unauthenticatedLoaders: {
          vortexGraphqlLoader: null,
        },
      }

      const {
        me: { artistRecommendations },
      } = await runAuthenticatedQuery(paginatedQuery, context)

      expect(artistRecommendations.edges).toHaveLength(1)
      expect(artistRecommendations.edges[0].node.internalID).toBe(
        "608a7416bdfbd1a789ba0911"
      )
    })

    it("respects the first argument for similar to followed recommendations", async () => {
      const paginatedQuery = gql`
        {
          me {
            artistRecommendations(first: 1, source: SIMILAR_TO_FOLLOWED) {
              totalCount
              edges {
                node {
                  internalID
                  slug
                }
              }
            }
          }
        }
      `

      const suggestedSimilarArtistsLoader = jest.fn(async () => ({
        body: [
          { artist: mockArtistsResponse.body[0] },
          { artist: mockArtistsResponse.body[1] },
        ],
      }))

      const context: any = {
        suggestedSimilarArtistsLoader,
        meLoader: () => Promise.resolve({}),
      }

      const {
        me: { artistRecommendations },
      } = await runAuthenticatedQuery(paginatedQuery, context)

      expect(artistRecommendations.edges).toHaveLength(1)
      expect(artistRecommendations.edges[0].node.internalID).toBe(
        "608a7416bdfbd1a789ba0911"
      )
    })
  })
})

const mockVortexResponse = {
  data: {
    artistRecommendations: {
      edges: [
        {
          node: {
            artistId: "608a7416bdfbd1a789ba0911",
            score: 3.2225049587839654,
          },
        },
        {
          node: {
            artistId: "608a7417bdfbd1a789ba092a",
            score: 3.422242962512335,
          },
        },
      ],
      totalCount: 2,
    },
  },
}

const mockArtistsResponse = {
  body: [
    {
      _id: "608a7416bdfbd1a789ba0911",
      artworks_count: 1,
      birthday: "",
      blurb: "",
      consignable: false,
      deathday: "",
      forsale_artworks_count: 0,
      group_indicator: "individual",
      id: "banksy",
      image_url:
        "https://d32dm0rphc51dk.cloudfront.net/jS7hjyXq3OKxNqWZPJeLPg/:version.jpg",
      image_urls: {
        four_thirds:
          "https://d32dm0rphc51dk.cloudfront.net/jS7hjyXq3OKxNqWZPJeLPg/four_thirds.jpg",
        large:
          "https://d32dm0rphc51dk.cloudfront.net/jS7hjyXq3OKxNqWZPJeLPg/large.jpg",
        square:
          "https://d32dm0rphc51dk.cloudfront.net/jS7hjyXq3OKxNqWZPJeLPg/square.jpg",
        tall:
          "https://d32dm0rphc51dk.cloudfront.net/jS7hjyXq3OKxNqWZPJeLPg/tall.jpg",
      },
      image_versions: ["square", "four_thirds", "large", "tall"],
      medium_known_for: null,
      name: "1+1+1",
      nationality: "Swedish Icelandic Finnish",
      original_height: 5237,
      original_width: 3491,
      public: true,
      published_artworks_count: 0,
      sortable_id: "banksy",
      target_supply: false,
      target_supply_priority: null,
      target_supply_type: null,
      years: "",
    },
    {
      _id: "608a7417bdfbd1a789ba092a",
      artworks_count: 1,
      birthday: "",
      blurb: "",
      consignable: false,
      deathday: "",
      forsale_artworks_count: 0,
      group_indicator: "individual",
      id: "1-plus-1-plus-1",
      image_url:
        "https://d32dm0rphc51dk.cloudfront.net/jS7hjyXq3OKxNqWZPJeLPg/:version.jpg",
      image_urls: {
        four_thirds:
          "https://d32dm0rphc51dk.cloudfront.net/jS7hjyXq3OKxNqWZPJeLPg/four_thirds.jpg",
        large:
          "https://d32dm0rphc51dk.cloudfront.net/jS7hjyXq3OKxNqWZPJeLPg/large.jpg",
        square:
          "https://d32dm0rphc51dk.cloudfront.net/jS7hjyXq3OKxNqWZPJeLPg/square.jpg",
        tall:
          "https://d32dm0rphc51dk.cloudfront.net/jS7hjyXq3OKxNqWZPJeLPg/tall.jpg",
      },
      image_versions: ["square", "four_thirds", "large", "tall"],
      medium_known_for: null,
      name: "1+1+1",
      nationality: "Swedish Icelandic Finnish",
      original_height: 5237,
      original_width: 3491,
      public: true,
      published_artworks_count: 0,
      sortable_id: "1-plus-1-plus-1",
      target_supply: false,
      target_supply_priority: null,
      target_supply_type: null,
      years: "",
    },
  ],
}
