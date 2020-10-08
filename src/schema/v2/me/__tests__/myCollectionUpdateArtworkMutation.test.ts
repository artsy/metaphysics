import { runAuthenticatedQuery } from "schema/v2/test/utils"
import gql from "lib/gql"

const updatedArtwork = { id: "some-artwork-id" }
const updateArtworkLoader = jest.fn().mockResolvedValue(updatedArtwork)

const artworkDetails = { medium: "Updated" }
const artworkLoader = jest.fn().mockResolvedValue(artworkDetails)

const createImageLoader = jest.fn()

const computeMutationInput = (externalImageUrls: string[] = []): string => {
  const mutation = gql`
    mutation {
      myCollectionUpdateArtwork(
        input: {
          artistIds: ["4d8b92b34eb68a1b2c0003f4"]
          artworkId: "some-artwork-id"
          category: "some strange category"
          costCurrencyCode: "USD"
          costMinor: 200
          date: "1990"
          depth: "20"
          editionNumber: "5"
          editionSize: "100x100x100"
          externalImageUrls: ${JSON.stringify(externalImageUrls)}
          height: "20"
          medium: "Updated"
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

const defaultContext = {
  myCollectionUpdateArtworkLoader: updateArtworkLoader,
  myCollectionArtworkLoader: artworkLoader,
  myCollectionCreateImageLoader: createImageLoader,
}

describe("myCollectionUpdateArtworkMutation", () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  describe("when the server responds with an error", () => {
    it("returns an error", async () => {
      const mutation = computeMutationInput()

      const serverError = "Error updating artwork"
      const url =
        "https://stagingapi.artsy.net/api/v1/my_collection?id=some-artwork-id"
      const error = new Error(`${url} - {"error":"${serverError}"}`)
      const failureLoader = jest.fn().mockRejectedValue(error)

      const context = {
        ...defaultContext,
        myCollectionUpdateArtworkLoader: failureLoader,
      }

      const data = await runAuthenticatedQuery(mutation, context)
      const { artworkOrError } = data.myCollectionUpdateArtwork
      const { message } = artworkOrError.mutationError

      expect(message).toEqual(serverError)
    })
  })

  describe("when the server response is successful", () => {
    it("returns details of the new artwork", async () => {
      const mutation = computeMutationInput()

      const data = await runAuthenticatedQuery(mutation, defaultContext)
      const { artworkOrError } = data.myCollectionUpdateArtwork

      expect(artworkOrError).toEqual({
        artwork: {
          medium: "Updated",
        },
        artworkEdge: {
          node: {
            medium: "Updated",
          },
        },
      })
    })
  })

  describe("creating additional images", () => {
    it("creates an additional image with bucket and key with a valid image url", async () => {
      const externalImageUrls = [
        "https://test-upload-bucket.s3.amazonaws.com/path/to/image.jpg",
      ]
      const mutation = computeMutationInput(externalImageUrls)

      const data = await runAuthenticatedQuery(mutation, defaultContext)
      const { artworkOrError } = data.myCollectionUpdateArtwork

      expect(artworkOrError).toHaveProperty("artwork")
      expect(artworkOrError).not.toHaveProperty("error")
      expect(createImageLoader).toBeCalledWith(updatedArtwork.id, {
        source_bucket: "test-upload-bucket",
        source_key: "path/to/image.jpg",
      })
    })

    it("returns an error when the additional image can't be created", async () => {
      const externalImageUrls = [
        "https://test-upload-bucket.s3.amazonaws.com/path/to/image.jpg",
      ]
      const mutation = computeMutationInput(externalImageUrls)

      const serverError = "Error creating image"
      const url =
        "https://stagingapi.artsy.net/api/v1/artwork/some-artwork-id/images"
      const error = new Error(`${url} - {"error":"${serverError}"}`)
      const failureLoader = jest.fn().mockRejectedValue(error)

      const context = {
        ...defaultContext,
        myCollectionCreateImageLoader: failureLoader,
      }

      const data = await runAuthenticatedQuery(mutation, context)
      const { artworkOrError } = data.myCollectionUpdateArtwork
      const { message } = artworkOrError.mutationError

      expect(message).toEqual(serverError)
    })
  })
})
