/* eslint-disable promise/always-return */
import gql from "lib/gql"
import { HTTPError } from "lib/HTTPError"
import { runAuthenticatedQuery } from "schema/v2/test/utils"

describe("artworkRecommendations", () => {
  const query = gql`
    {
      me {
        artworkRecommendations(first: 2) {
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

  it("returns artwork recommendations with order from Vortex", async () => {
    const vortexGraphQLAuthenticatedLoader = jest.fn(() => async () =>
      vortexResponse
    )

    const artworksLoader = jest.fn(async () => artworksResponse)

    const context: any = {
      artworksLoader,
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
      me: { artworkRecommendations },
    } = await runAuthenticatedQuery(query, context)

    expect(vortexGraphQLAuthenticatedLoader).toHaveBeenCalledWith({
      query: gql`
        query artworkRecommendationsQuery {
          artworkRecommendations(first: 50, userId: "vortex-user-id") {
            totalCount
            edges {
              node {
                artworkId
                score
              }
            }
          }
        }
      `,
    })

    expect(artworksLoader).toHaveBeenCalledWith({
      ids: ["608a7417bdfbd1a789ba092a", "308a7416bdfbd1a789ba0911"],
    })

    expect(artworkRecommendations).toMatchInlineSnapshot(`
      {
        "edges": [
          {
            "node": {
              "internalID": "608a7417bdfbd1a789ba092a",
              "slug": "gerhard-richter-abendstimmung-evening-calm-2",
            },
          },
          {
            "node": {
              "internalID": "308a7416bdfbd1a789ba0911",
              "slug": "pablo-picasso-deux-femmes-nues-dans-un-arbre-2",
            },
          },
        ],
        "totalCount": 4,
      }
    `)
  })

  it("doesn't return artworks if no artwork recommendations are present", async () => {
    const vortexGraphqlLoader = jest.fn(() => async () => ({
      data: {
        artworkRecommendations: {
          edges: [],
          totalCount: 0,
        },
      },
    }))

    const artworksLoader = jest.fn(async () => artworksResponse)

    const context: any = {
      artworksLoader,
      meLoader: () => Promise.resolve({}),
      authenticatedLoaders: {
        vortexGraphqlLoader: vortexGraphqlLoader,
      },
      unauthenticatedLoaders: {
        vortexGraphqlLoader: null,
      },
    }

    const {
      me: { artworkRecommendations },
    } = await runAuthenticatedQuery(query, context)

    expect(artworkRecommendations).toMatchInlineSnapshot(`
      {
        "edges": [],
        "totalCount": 0,
      }
    `)

    expect(vortexGraphqlLoader).toHaveBeenCalled()
    expect(artworksLoader).not.toHaveBeenCalled()
  })

  it("doesn't fetch artworks when the requested page is past the end", async () => {
    const vortexGraphqlLoader = jest.fn(() => async () => vortexResponse)
    const artworksLoader = jest.fn(async () => artworksResponse)

    const context: any = {
      artworksLoader,
      meLoader: () => Promise.resolve({}),
      userID: "vortex-user-id",
      authenticatedLoaders: {
        vortexGraphqlLoader,
      },
      unauthenticatedLoaders: {
        vortexGraphqlLoader: null,
      },
    }

    const {
      me: { artworkRecommendations },
    } = await runAuthenticatedQuery(
      gql`
        {
          me {
            artworkRecommendations(first: 2, page: 5) {
              totalCount
              edges {
                node {
                  internalID
                }
              }
            }
          }
        }
      `,
      context
    )

    // Vortex returns 4 IDs, but page 5 starts past the end, so there are no
    // IDs to look up. Calling artworksLoader with an empty `ids` array would
    // drop the param and return an unfiltered page of artworks from Gravity.
    expect(artworksLoader).not.toHaveBeenCalled()

    expect(artworkRecommendations).toMatchInlineSnapshot(`
      {
        "edges": [],
        "totalCount": 4,
      }
    `)
  })

  describe("Gravity vs Vortex routing", () => {
    it("fetches IDs from the Gravity REST endpoint with the same response shape", async () => {
      const vortexGraphqlLoader = jest.fn(() => async () => vortexResponse)
      const artworkRecommendationsLoader = jest.fn(async () => ({
        artwork_ids: ["608a7417bdfbd1a789ba092a", "308a7416bdfbd1a789ba0911"],
      }))
      const artworksLoader = jest.fn(async () => artworksResponse)

      const context: any = {
        artworksLoader,
        artworkRecommendationsLoader,
        meLoader: () => Promise.resolve({}),
        userID: "gravity-user-id",
        userAgent: "Artsy-Mobile/9.11.0",
        authenticatedLoaders: {
          vortexGraphqlLoader,
        },
        unauthenticatedLoaders: {
          vortexGraphqlLoader: null,
        },
      }

      const {
        me: { artworkRecommendations },
      } = await runAuthenticatedQuery(query, context)

      expect(artworkRecommendationsLoader).toHaveBeenCalledWith({ size: 50 })
      expect(vortexGraphqlLoader).not.toHaveBeenCalled()
      expect(artworksLoader).toHaveBeenCalledWith({
        ids: ["608a7417bdfbd1a789ba092a", "308a7416bdfbd1a789ba0911"],
      })

      expect(artworkRecommendations).toMatchInlineSnapshot(`
        {
          "edges": [
            {
              "node": {
                "internalID": "608a7417bdfbd1a789ba092a",
                "slug": "gerhard-richter-abendstimmung-evening-calm-2",
              },
            },
            {
              "node": {
                "internalID": "308a7416bdfbd1a789ba0911",
                "slug": "pablo-picasso-deux-femmes-nues-dans-un-arbre-2",
              },
            },
          ],
          "totalCount": 2,
        }
      `)
    })

    it("treats a Gravity 404 (kill-switch) as an empty connection", async () => {
      const vortexGraphqlLoader = jest.fn(() => async () => vortexResponse)
      const artworkRecommendationsLoader = jest.fn(async () => {
        throw new HTTPError("Not Found", 404)
      })
      const artworksLoader = jest.fn(async () => artworksResponse)

      const context: any = {
        artworksLoader,
        artworkRecommendationsLoader,
        meLoader: () => Promise.resolve({}),
        userID: "gravity-user-id",
        userAgent: "Artsy-Mobile/9.11.0",
        authenticatedLoaders: {
          vortexGraphqlLoader,
        },
        unauthenticatedLoaders: {
          vortexGraphqlLoader: null,
        },
      }

      const {
        me: { artworkRecommendations },
      } = await runAuthenticatedQuery(query, context)

      expect(artworkRecommendations).toMatchInlineSnapshot(`
        {
          "edges": [],
          "totalCount": 0,
        }
      `)

      expect(vortexGraphqlLoader).not.toHaveBeenCalled()
      expect(artworksLoader).not.toHaveBeenCalled()
    })

    it("propagates a non-404 Gravity error instead of silently emptying", async () => {
      const vortexGraphqlLoader = jest.fn(() => async () => vortexResponse)
      const artworkRecommendationsLoader = jest.fn(async () => {
        throw new HTTPError("Internal Server Error", 500)
      })
      const artworksLoader = jest.fn(async () => artworksResponse)

      const context: any = {
        artworksLoader,
        artworkRecommendationsLoader,
        meLoader: () => Promise.resolve({}),
        userID: "gravity-user-id",
        userAgent: "Artsy-Mobile/9.11.0",
        authenticatedLoaders: {
          vortexGraphqlLoader,
        },
        unauthenticatedLoaders: {
          vortexGraphqlLoader: null,
        },
      }

      await expect(runAuthenticatedQuery(query, context)).rejects.toThrow(
        "Internal Server Error"
      )
      expect(vortexGraphqlLoader).not.toHaveBeenCalled()
      expect(artworksLoader).not.toHaveBeenCalled()
    })

    it("stays on the Vortex path for non-eigen clients (e.g. web)", async () => {
      const vortexGraphqlLoader = jest.fn(() => async () => vortexResponse)
      const artworkRecommendationsLoader = jest.fn()
      const artworksLoader = jest.fn(async () => artworksResponse)

      const context: any = {
        artworksLoader,
        artworkRecommendationsLoader,
        meLoader: () => Promise.resolve({}),
        userID: "gravity-user-id",
        authenticatedLoaders: {
          vortexGraphqlLoader,
        },
        unauthenticatedLoaders: {
          vortexGraphqlLoader: null,
        },
      }

      await runAuthenticatedQuery(query, context)

      expect(artworkRecommendationsLoader).not.toHaveBeenCalled()
      expect(vortexGraphqlLoader).toHaveBeenCalled()
    })

    it("stays on the Vortex path for eigen versions below 9.11.0", async () => {
      const vortexGraphqlLoader = jest.fn(() => async () => vortexResponse)
      const artworkRecommendationsLoader = jest.fn()
      const artworksLoader = jest.fn(async () => artworksResponse)

      const context: any = {
        artworksLoader,
        artworkRecommendationsLoader,
        meLoader: () => Promise.resolve({}),
        userID: "gravity-user-id",
        userAgent: "Artsy-Mobile/9.10.0",
        authenticatedLoaders: {
          vortexGraphqlLoader,
        },
        unauthenticatedLoaders: {
          vortexGraphqlLoader: null,
        },
      }

      await runAuthenticatedQuery(query, context)

      expect(artworkRecommendationsLoader).not.toHaveBeenCalled()
      expect(vortexGraphqlLoader).toHaveBeenCalled()
    })

    it("stays on the Vortex path for impersonated/app requests", async () => {
      const vortexGraphqlLoader = jest.fn(() => async () => vortexResponse)
      const artworkRecommendationsLoader = jest.fn()
      const artworksLoader = jest.fn(async () => artworksResponse)

      const context: any = {
        artworksLoader,
        artworkRecommendationsLoader,
        meLoader: () => Promise.resolve({}),
        userAgent: "Artsy-Mobile/9.11.0",
        xImpersonateUserID: "impersonated-user-id",
        authenticatedLoaders: {
          vortexGraphqlLoader,
        },
        unauthenticatedLoaders: {
          vortexGraphqlLoader,
        },
      }

      await runAuthenticatedQuery(query, context)

      expect(artworkRecommendationsLoader).not.toHaveBeenCalled()
      expect(vortexGraphqlLoader).toHaveBeenCalled()
    })
  })
})

const vortexResponse = {
  data: {
    artworkRecommendations: {
      edges: [
        {
          node: {
            artworkId: "608a7417bdfbd1a789ba092a",
            score: 3.422242962512335,
          },
        },
        {
          node: {
            artworkId: "308a7416bdfbd1a789ba0911",
            score: 3.2225049587839654,
          },
        },
        {
          node: {
            artworkId: "208a7416bdfbd1a789ba0911",
            score: 4.2225049587839654,
          },
        },
        {
          node: {
            artworkId: "108a7416bdfbd1a789ba0911",
            score: 5.2225049587839654,
          },
        },
      ],
      totalCount: 4,
    },
  },
}

const artworksResponse = [
  {
    _id: "608a7417bdfbd1a789ba092a",
    id: "gerhard-richter-abendstimmung-evening-calm-2",
    slug: "gerhard-richter-abendstimmung-evening-calm-2",
  },
  {
    _id: "308a7416bdfbd1a789ba0911",
    id: "pablo-picasso-deux-femmes-nues-dans-un-arbre-2",
    slug: "pablo-picasso-deux-femmes-nues-dans-un-arbre-2",
  },
]
