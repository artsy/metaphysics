/* eslint-disable promise/always-return */
import gql from "lib/gql"
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
    const vortexGraphqlLoader = jest.fn(() => async () => vortexResponse)

    const artworksLoader = jest.fn(async () => artworksResponse)

    const context = {
      meLoader: () => Promise.resolve({}),
      vortexGraphqlLoader,
      artworksLoader,
    }

    const {
      me: { artworkRecommendations },
    } = await runAuthenticatedQuery(query, context)

    expect(vortexGraphqlLoader).toHaveBeenCalledWith({
      query: gql`
        query artworkRecommendationsQuery {
          artworkRecommendations(first: 50) {
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
      Object {
        "edges": Array [
          Object {
            "node": Object {
              "internalID": "608a7417bdfbd1a789ba092a",
              "slug": "gerhard-richter-abendstimmung-evening-calm-2",
            },
          },
          Object {
            "node": Object {
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
          totalCount: 0,
          edges: [],
        },
      },
    }))

    const artworksLoader = jest.fn(async () => artworksResponse)

    const context = {
      meLoader: () => Promise.resolve({}),
      vortexGraphqlLoader,
      artworksLoader,
    }

    const {
      me: { artworkRecommendations },
    } = await runAuthenticatedQuery(query, context)

    expect(artworkRecommendations).toMatchInlineSnapshot(`
      Object {
        "edges": Array [],
        "totalCount": 0,
      }
    `)

    expect(vortexGraphqlLoader).toHaveBeenCalled()
    expect(artworksLoader).not.toHaveBeenCalled()
  })
})

const vortexResponse = {
  data: {
    artworkRecommendations: {
      totalCount: 4,
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
