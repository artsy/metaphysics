import { runQuery } from "schema/v2/test/utils"
import config from "config"

beforeAll(() => {
  config.WEAVIATE_API_BASE = "https://api.artsy.net/v1"
})

describe.skip("DiscoverArtworks", () => {
  let context

  const artworkIds = [
    {
      internalID: "percy-cat",
    },
    {
      internalID: "fiby-cat",
    },
  ]

  const artworks = [
    {
      internalID: "percy-cat",
      title: "Percy Cat",
    },
    {
      internalID: "fiby-cat",
      title: "Fiby Cat",
    },
  ]

  beforeEach(() => {
    context = {
      weaviateGraphqlLoader: () => () => {
        return Promise.resolve({
          data: {
            Get: {
              InfiniteDiscoveryArtworks: artworkIds,
            },
          },
        })
      },
      artworksLoader: () => Promise.resolve(artworks),
    }
  })

  it("returns artworks connection", async () => {
    const query = `
        {
          discoverArtworks(userId: "user-xyz") {
            edges {
              node {
                title
              }
            }
          }
        }
      `

    const { discoverArtworks } = await runQuery(query, context)

    expect(discoverArtworks.edges).toMatchInlineSnapshot(`
      [
        {
          "node": {
            "title": "Percy Cat",
          },
        },
        {
          "node": {
            "title": "Fiby Cat",
          },
        },
      ]
    `)
  })
})
