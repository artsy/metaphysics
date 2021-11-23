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
              id
            }
          }
        }
      }
    }
  `

  it("returns artist recommendations from Vortex", async () => {
    const vortexGraphqlLoader = jest.fn(() => async () => mockVortexResponse)

    const artistsLoader = jest.fn(async () => mockArtistsResponse)

    const context = {
      meLoader: () => Promise.resolve({}),
      vortexGraphqlLoader,
      artistsLoader,
    }

    const {
      me: { artistRecommendations },
    } = await runAuthenticatedQuery(query, context)

    expect(artistRecommendations).toMatchInlineSnapshot(`
      Object {
        "edges": Array [
          Object {
            "node": Object {
              "id": "QXJ0aXN0OjYwOGE3NDE3YmRmYmQxYTc4OWJhMDkyYQ==",
              "internalID": "608a7417bdfbd1a789ba092a",
              "slug": "yayoi-kusama",
            },
          },
        ],
        "totalCount": 50,
      }
    `)

    expect(vortexGraphqlLoader).toHaveBeenCalledWith({
      query: gql`
        query artistRecommendationsQuery {
          artistRecommendations(first: 50) {
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
      artist_ids: ["608a7417bdfbd1a789ba092a", "608a7416bdfbd1a789ba0911"],
      offset: 0,
      size: 100,
    })
  })

  it("doesn't return artists if no artist recommendations are present", async () => {
    const vortexGraphqlLoader = jest.fn(() => async () => ({
      data: {
        artistRecommendations: {
          totalCount: 0,
          edges: [],
        },
      },
    }))

    const artistsLoader = jest.fn(async () => mockArtistsResponse)

    const context = {
      meLoader: () => Promise.resolve({}),
      vortexGraphqlLoader,
      artistsLoader,
    }

    const {
      me: { artistRecommendations },
    } = await runAuthenticatedQuery(query, context)

    expect(artistRecommendations).toMatchInlineSnapshot(`
      Object {
        "edges": Array [],
        "totalCount": 0,
      }
    `)

    expect(vortexGraphqlLoader).toHaveBeenCalled()
    expect(artistsLoader).not.toHaveBeenCalled()
  })
})

const mockVortexResponse = {
  data: {
    artistRecommendations: {
      totalCount: 2,
      edges: [
        {
          node: {
            artistId: "608a7417bdfbd1a789ba092a",
            score: 3.422242962512335,
          },
        },
        {
          node: {
            artistId: "608a7416bdfbd1a789ba0911",
            score: 3.2225049587839654,
          },
        },
      ],
    },
  },
}

const mockArtistsResponse = [
  {
    _id: "608a7417bdfbd1a789ba092a",
    artists_count: 3,
    birthday: "",
    blurb: "",
    consignable: false,
    deathday: "",
    forsale_artists_count: 2,
    group_indicator: "individual",
    id: "yayoi-kusama",
    image_url: null,
    image_urls: {},
    image_versions: [],
    medium_known_for: null,
    name: "Yayoi Kusama",
    nationality: "",
    original_height: null,
    original_width: null,
    public: true,
    published_artists_count: 3,
    sortable_id: "kusama-yayoi",
    target_supply: false,
    target_supply_priority: null,
    target_supply_type: null,
    years: "",
  },
]
