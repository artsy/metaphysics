import { runAuthenticatedQuery } from "schema/v2/test/utils"
import gql from "lib/gql"

describe("myCollectionCreateArtworkMutation", () => {
  const mutation = gql`
    mutation {
      myCollectionCreateArtwork(
        input: {
          artistIds: ["4d8b92b34eb68a1b2c0003f4"]
          category: "some strange category"
          costCurrencyCode: "USD"
          costMinor: 200
          editionSize: "10x10x10"
          editionNumber: 1
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
      myCollectionCreateArtworkLoader: () =>
        Promise.reject(
          new Error(
            `https://stagingapi.artsy.net/api/v1/my_collection?id=foo - {"error":"Error creating artwork"}`
          )
        ),
    }

    const data = await runAuthenticatedQuery(mutation, context)
    expect(data).toEqual({
      myCollectionCreateArtwork: {
        artworkOrError: {
          mutationError: {
            message: "Error creating artwork",
          },
        },
      },
    })
  })

  it("creates an artwork", async () => {
    const context = {
      myCollectionCreateArtworkLoader: () => Promise.resolve({ id: "foo" }),
      myCollectionArtworkLoader: () =>
        Promise.resolve({
          medium: "Painting",
        }),
    }

    const data = await runAuthenticatedQuery(mutation, context)
    expect(data).toEqual({
      myCollectionCreateArtwork: {
        artworkOrError: {
          artwork: {
            medium: "Painting",
          },
          artworkEdge: {
            node: {
              medium: "Painting",
            },
          },
        },
      },
    })
  })
})
