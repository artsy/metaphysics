import { runAuthenticatedQuery } from "schema/v2/test/utils"
import gql from "lib/gql"

const computeMutationInput = (): string => {
  const mutation = gql`
    mutation {
      myCollectionCreateArtwork(
        input: {
          artistIds: ["4d8b92b34eb68a1b2c0003f4"]
          category: "some strange category"
          costCurrencyCode: "USD"
          costMinor: 200
          editionSize: "10x10x10"
          editionNumber: "1"
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

  return mutation
}

describe("myCollectionCreateArtworkMutation", () => {
  describe("when the server responds with an error", () => {
    it("returns that error", async () => {
      const mutation = computeMutationInput()

      const serverError = "Error creating artwork"

      const error = new Error(
        `https://stagingapi.artsy.net/api/v1/my_collection?id=some-artwork-id - {"error":"${serverError}"}`
      )

      const mockLoader = jest.fn().mockRejectedValue(error)

      const context = {
        myCollectionCreateArtworkLoader: mockLoader,
      }

      const data = await runAuthenticatedQuery(mutation, context)
      expect(data).toEqual({
        myCollectionCreateArtwork: {
          artworkOrError: {
            mutationError: {
              message: serverError,
            },
          },
        },
      })
    })
  })

  describe("when the server response is successful", () => {
    it("returns details of the new artwork", async () => {
      const mutation = computeMutationInput()

      const newArtwork = { id: "some-artwork-id" }
      const mockLoader = jest.fn().mockResolvedValue(newArtwork)

      const additionalArtworkDetails = { medium: "Painting" }
      const anotherMockLoader = jest
        .fn()
        .mockResolvedValue(additionalArtworkDetails)

      const context = {
        myCollectionCreateArtworkLoader: mockLoader,
        myCollectionArtworkLoader: anotherMockLoader,
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
})
