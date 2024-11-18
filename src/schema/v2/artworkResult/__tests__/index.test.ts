import { HTTPError } from "lib/HTTPError"
import { runQuery } from "schema/v2/test/utils"

describe("Artwork type", () => {
  describe("when throwing an error", () => {
    const artwork = {
      artist_ids: ["artist-id"],
      partner_id: "partner-id",
      id: "artwork-slug",
      _id: "artwork-id",
    }

    const relatedArtworksResponse = [
      {
        id: "leonor-fini-les-aveugles",
      },
      {
        id: "gregorio-vardanega-cereles-metaphorique",
      },
      {
        id: "joaquin-torres-garcia-grafismo-del-hombre-y-barco",
      },
    ]

    const context = {
      artworkLoader: () => {
        throw new HTTPError(
          "Artwork Not Found",
          404,
          JSON.stringify({ artwork })
        )
      },
      relatedLayersLoader: () => Promise.resolve([{ id: "main" }]),
      relatedLayerArtworksLoader: () =>
        Promise.resolve(relatedArtworksResponse),
      artistLoader: () => Promise.resolve({ name: "Catty Artist" }),
      partnerLoader: () => Promise.resolve({ name: "Catty Partner" }),
    }
    const query = `
      {
        artworkResult(id: "richard-prince-untitled-portrait") {
          ... on ArtworkError {
            __typename
            requestError {
              statusCode
            }
            artwork {
              internalID
              slug
              layer {
                artworksConnection {
                  edges {
                    node {
                      slug
                    }
                  }
                }
              }
            }
          }
        }
      }
    `

    it("returns the proper type", async () => {
      const data = await runQuery(query, context)

      expect(data).toMatchInlineSnapshot(`
        {
          "artworkResult": {
            "__typename": "ArtworkError",
            "artwork": {
              "internalID": "artwork-id",
              "layer": {
                "artworksConnection": {
                  "edges": [
                    {
                      "node": {
                        "slug": "leonor-fini-les-aveugles",
                      },
                    },
                    {
                      "node": {
                        "slug": "gregorio-vardanega-cereles-metaphorique",
                      },
                    },
                    {
                      "node": {
                        "slug": "joaquin-torres-garcia-grafismo-del-hombre-y-barco",
                      },
                    },
                  ],
                },
              },
              "slug": "artwork-slug",
            },
            "requestError": {
              "statusCode": 404,
            },
          },
        }
      `)
    })

    it("resolves on an unknown error w/o a partial artwork response", async () => {
      context.artworkLoader = () => {
        throw new Error("Unknown Error")
      }
      const data = await runQuery(query, context)

      expect(data).toMatchInlineSnapshot(`
        {
          "artworkResult": {
            "__typename": "ArtworkError",
            "artwork": null,
            "requestError": {
              "statusCode": 500,
            },
          },
        }
      `)
    })
  })

  describe("without any errors", () => {
    const artwork = {
      artists: [{ id: "artist-id" }],
    }

    const context = {
      artworkLoader: () => Promise.resolve(artwork),
      unauthenticatedLoaders: {
        artistLoader: () => Promise.resolve({ name: "Catty Artist" }),
      },
    }
    const query = `
      {
        artworkResult(id: "richard-prince-untitled-portrait") {
          ... on Artwork {
            __typename
            artists {
              name
            }
          }
        }
      }
    `

    it("returns the proper type", async () => {
      const data = await runQuery(query, context)

      expect(data).toMatchInlineSnapshot(`
        {
          "artworkResult": {
            "__typename": "Artwork",
            "artists": [
              {
                "name": "Catty Artist",
              },
            ],
          },
        }
      `)
    })
  })
})
