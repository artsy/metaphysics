import { HTTPError } from "lib/HTTPError"
import { runQuery } from "schema/v2/test/utils"

describe("Artwork type", () => {
  describe("when throwing an error", () => {
    const artwork = {
      artist_ids: ["artist-id"],
    }

    const context = {
      artworkLoader: () => {
        throw new HTTPError(
          "Artwork Not Found",
          404,
          JSON.stringify({ artwork })
        )
      },
      artistLoader: () => Promise.resolve({ name: "Catty Artist" }),
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
              artists {
                name
              }
            }
          }
        }
      }
    `

    it("returns the proper type", async () => {
      const data = await runQuery(query, context)

      expect(data).toMatchInlineSnapshot(`
        Object {
          "artworkResult": Object {
            "__typename": "ArtworkError",
            "artwork": Object {
              "artists": Array [
                Object {
                  "name": "Catty Artist",
                },
              ],
            },
            "requestError": Object {
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
        Object {
          "artworkResult": Object {
            "__typename": "ArtworkError",
            "artwork": null,
            "requestError": Object {
              "statusCode": 500,
            },
          },
        }
      `)
    })
  })

  describe("without any errors", () => {
    const artwork = {
      published: true,
      artists: [{ id: "artist-id" }],
    }

    const context = {
      artworkLoader: () => Promise.resolve(artwork),
      artistLoader: () => Promise.resolve({ name: "Catty Artist" }),
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
        Object {
          "artworkResult": Object {
            "__typename": "Artwork",
            "artists": Array [
              Object {
                "name": "Catty Artist",
              },
            ],
          },
        }
      `)
    })
  })
})
