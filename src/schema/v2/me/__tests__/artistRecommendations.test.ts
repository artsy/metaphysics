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
              "internalID": "608a7417bdfbd1a789ba092a",
              "slug": "1-plus-1-plus-1",
            },
          },
          Object {
            "node": Object {
              "internalID": "608a7416bdfbd1a789ba0911",
              "slug": "banksy",
            },
          },
        ],
        "totalCount": 2,
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
      ids: ["608a7417bdfbd1a789ba092a", "608a7416bdfbd1a789ba0911"],
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
        square:
          "https://d32dm0rphc51dk.cloudfront.net/jS7hjyXq3OKxNqWZPJeLPg/square.jpg",
        four_thirds:
          "https://d32dm0rphc51dk.cloudfront.net/jS7hjyXq3OKxNqWZPJeLPg/four_thirds.jpg",
        large:
          "https://d32dm0rphc51dk.cloudfront.net/jS7hjyXq3OKxNqWZPJeLPg/large.jpg",
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
        square:
          "https://d32dm0rphc51dk.cloudfront.net/jS7hjyXq3OKxNqWZPJeLPg/square.jpg",
        four_thirds:
          "https://d32dm0rphc51dk.cloudfront.net/jS7hjyXq3OKxNqWZPJeLPg/four_thirds.jpg",
        large:
          "https://d32dm0rphc51dk.cloudfront.net/jS7hjyXq3OKxNqWZPJeLPg/large.jpg",
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
