import { runAuthenticatedQuery } from "schema/v2/test/utils"
import gql from "lib/gql"

describe("myCollectionUpdateArtworkMutation", () => {
  const mutation = gql`
    mutation {
      myCollectionUpdateArtwork(
        input: {
          artistIds: ["4d8b92b34eb68a1b2c0003f4"]
          artworkId: "foo"
          category: "some strange category"
          costCurrencyCode: "USD"
          costMinor: 200
          date: "1990"
          depth: "20"
          height: "20"
          medium: "Painting"
          metric: "in"
          title: "hey now"
          width: "20"
        }
      ) {
        artworkOrError {
          ... on MyCollectionArtworkMutationSuccess {
            artwork {
              medium
            }
            artworkEdge {
              node {
                medium
              }
            }
          }
          ... on MyCollectionArtworkMutationFailure {
            mutationError {
              message
            }
          }
        }
      }
    }
  `

  it("returns an error", async () => {
    const context = {
      myCollectionUpdateArtworkLoader: () =>
        Promise.reject(
          new Error(
            `https://stagingapi.artsy.net/api/v1/my_collection/artworks/foo - {"error":"Error updating artwork"}`
          )
        ),
    }

    const data = await runAuthenticatedQuery(mutation, context)
    expect(data).toEqual({
      myCollectionUpdateArtwork: {
        artworkOrError: {
          mutationError: {
            message: "Error updating artwork",
          },
        },
      },
    })
  })

  it("updates an artwork", async () => {
    const context = {
      myCollectionUpdateArtworkLoader: () => Promise.resolve({ id: "foo" }),
      myCollectionArtworkLoader: () =>
        Promise.resolve({
          medium: "Updated",
        }),
    }

    const data = await runAuthenticatedQuery(mutation, context)
    expect(data).toEqual({
      myCollectionUpdateArtwork: {
        artworkOrError: {
          artwork: {
            medium: "Updated",
          },
          artworkEdge: {
            node: {
              medium: "Updated",
            },
          },
        },
      },
    })
  })
})
