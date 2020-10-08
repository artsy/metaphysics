/* eslint-disable promise/always-return */
import { runAuthenticatedQuery } from "schema/v2/test/utils"

describe("Me", () => {
  describe("Followed Galleries", () => {
    it("returns galleries followed by me", async () => {
      const query = `
        {
          me {
            followsAndSaves {
              galleriesConnection(first: 10) {
                edges {
                  node {
                    name
                  }
                }
              }
            }
          }
        }
      `

      const galleries = new Array(3)
        .fill(0)
        .map((_, index: number) => `gallery${index}`)

      const edges = galleries.map((_) => ({
        node: {
          name: _,
        },
      }))

      const galleryResponse = {
        headers: { "x-total-count": "3" },
        body: galleries.map((_) => ({
          profile: {
            owner: {
              name: _,
            },
          },
        })),
      }

      const expectedConnectionData = {
        edges,
      }

      await runAuthenticatedQuery(query, {
        followedPartnersLoader: () => Promise.resolve(galleryResponse),
      }).then(
        ({
          me: {
            followsAndSaves: { galleriesConnection },
          },
        }) => {
          expect(galleriesConnection).toEqual(expectedConnectionData)
        }
      )
    })
  })
})
