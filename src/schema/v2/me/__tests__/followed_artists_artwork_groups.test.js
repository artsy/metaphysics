/* eslint-disable promise/always-return */
import { assign } from "lodash"
import { runAuthenticatedQuery } from "schema/v2/test/utils"

describe("Me", () => {
  describe("Followed Artists Artwork Groups", () => {
    it("returns artworks grouped by artist", async () => {
      const query = `
        {
          me {
            followsAndSaves {
              bundledArtworksByArtistConnection(first: 10) {
                pageInfo {
                  hasNextPage
                }
                edges {
                  node {
                    summary
                    artists
                    artworksConnection(first: 10) {
                      edges {
                        node {
                          title
                        }
                      }
                    }
                  }
                }
              }
            }
          }
        }
      `

      const artworkStub = { artist: { id: "percy-z", name: "Percy Z" } }

      const artwork1 = assign({}, artworkStub, { title: "Artwork1" })
      const artwork2 = assign({}, artworkStub, { title: "Artwork2" })

      const expectedConnectionData = {
        pageInfo: {
          hasNextPage: true,
        },
        edges: [
          {
            node: {
              summary: "2 works added",
              artists: "Percy Z",
              artworksConnection: {
                edges: [
                  {
                    node: { title: "Artwork1" },
                  },
                  {
                    node: { title: "Artwork2" },
                  },
                ],
              },
            },
          },
        ],
      }

      const artworkResponse = {
        headers: { "x-total-count": 11 },
        body: [artwork1, artwork2],
      }

      await runAuthenticatedQuery(query, {
        followedArtistsArtworksLoader: () => Promise.resolve(artworkResponse),
      }).then(
        ({
          me: {
            followsAndSaves: { bundledArtworksByArtistConnection },
          },
        }) => {
          expect(bundledArtworksByArtistConnection).toEqual(
            expectedConnectionData
          )
        }
      )
    })
  })
})
