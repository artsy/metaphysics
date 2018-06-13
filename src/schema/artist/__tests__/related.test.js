/* eslint-disable promise/always-return */
import { runQuery } from "test/utils"

describe("Artist type", () => {
  const artist = {
    id: "percy-z",
    birthday: "2012",
  }

  const artistsResponse = {
    headers: { "x-total-count": 35 },
    body: [{ id: "percy-z", birthday: "2012" }],
  }
  const loader = jest.fn().mockReturnValue(Promise.resolve(artistsResponse))

  const artistLoader = () => Promise.resolve(artist)
  const rootValue = {
    relatedContemporaryArtistsLoader: loader,
    relatedMainArtistsLoader: loader,
    artistLoader,
  }

  it("returns contemporary artists", () => {
    const query = `
      {
        artist(id: "percy-z") {
          related {
            contemporary(first: 10) {
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
      ({ artist: { related: { contemporary: { pageCursors, edges } } } }) => {
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

  it("returns main related artists", () => {
    const query = `
      {
        artist(id: "percy-z") {
          related {
            main(first: 10) {
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
      ({ artist: { related: { main: { pageCursors, edges } } } }) => {
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
})
