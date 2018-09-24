/* eslint-disable promise/always-return */
import { runQuery } from "test/utils"

describe("Artist type", () => {
  const artist = {
    id: "percy-z",
    birthday: "2012",
  }

  const contemporaryArtistsResponse = {
    headers: { "x-total-count": 35 },
    body: [{ id: "contemporary-percy-z", birthday: "2012" }],
  }
  const mainArtistsResponse = {
    headers: { "x-total-count": 35 },
    body: [{ id: "percy-z", birthday: "2012" }],
  }
  const relatedContemporaryArtistsLoader = jest
    .fn()
    .mockReturnValue(Promise.resolve(contemporaryArtistsResponse))

  const relatedMainArtistsLoader = jest
    .fn()
    .mockReturnValue(Promise.resolve(mainArtistsResponse))

  const artistLoader = () => Promise.resolve(artist)
  const rootValue = {
    relatedContemporaryArtistsLoader,
    relatedMainArtistsLoader,
    artistLoader,
    relatedGenesLoader: () => Promise.resolve([{ id: "catty-gene" }]),
  }

  it("returns contemporary artists", () => {
    const query = `
      {
        artist(id: "percy-z") {
          related {
            artists(kind: CONTEMPORARY, first: 10) {
              pageCursors {
                first {
                  page
                }
                around {
                  page
                }
                last {
                  page
                }
              }
              edges {
                node {
                  id
                }
              }
            }
          }
        }
      }
    `

    return runQuery(query, rootValue).then(
      ({
        artist: {
          related: {
            artists: { pageCursors, edges },
          },
        },
      }) => {
        // Check expected page cursors exist in response.
        const { first, around, last } = pageCursors
        expect(first).toEqual(null)
        expect(last).toEqual(null)
        expect(around.length).toEqual(4)
        let index
        for (index = 0; index < 4; index++) {
          expect(around[index].page).toBe(index + 1)
        }
        // Check auction result included in edges.
        expect(edges[0].node.id).toEqual("contemporary-percy-z")
      }
    )
  })

  it("returns main related artists", () => {
    const query = `
      {
        artist(id: "percy-z") {
          related {
            artists(kind: MAIN, first: 10) {
              pageCursors {
                first {
                  page
                }
                around {
                  page
                }
                last {
                  page
                }
              }
              edges {
                node {
                  id
                }
              }
            }
          }
        }
      }
    `

    return runQuery(query, rootValue).then(
      ({
        artist: {
          related: {
            artists: { pageCursors, edges },
          },
        },
      }) => {
        // Check expected page cursors exist in response.
        const { first, around, last } = pageCursors
        expect(first).toEqual(null)
        expect(last).toEqual(null)
        expect(around.length).toEqual(4)
        let index
        for (index = 0; index < 4; index++) {
          expect(around[index].page).toBe(index + 1)
        }
        // Check auction result included in edges.
        expect(edges[0].node.id).toEqual("percy-z")
      }
    )
  })

  it("returns related genes", () => {
    const query = `
      {
        artist(id: "percy-z") {
          related {
            genes(first: 10) {
              edges {
                node {
                  id
                }
              }
            }
          }
        }
      }
    `

    return runQuery(query, rootValue).then(
      ({
        artist: {
          related: {
            genes: { edges },
          },
        },
      }) => {
        expect(edges[0].node.id).toEqual("catty-gene")
      }
    )
  })
})
