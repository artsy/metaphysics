import { runAuthenticatedQuery } from "schema/v2/test/utils"
import gql from "lib/gql"

const updatedArtwork = { id: "some-artwork-id" }
const updateArtworkLoader = jest.fn().mockResolvedValue(updatedArtwork)

const artworkDetails = { medium: "Updated" }
const artworkLoader = jest.fn().mockResolvedValue(artworkDetails)

const createImageLoader = jest.fn()

const computeMutationInput = ({
  externalImageUrls = [],
  editionSize = null,
  editionNumber = null,
}: {
  externalImageUrls?: string[]
  editionSize?: string | null
  editionNumber?: string | null
} = {}): string => {
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
          editionNumber: ${JSON.stringify(editionNumber)}
          editionSize: ${JSON.stringify(editionSize)}
          externalImageUrls: ${JSON.stringify(externalImageUrls)}
          height: "20"
          medium: "Updated"
          metric: "in"
          provenance: "Pat Hearn Gallery"
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

const createArtworkEditionSetLoader = jest.fn()
const updateArtworkEditionSetLoader = jest.fn()
const defaultContext = {
  updateArtworkLoader,
  artworkLoader: artworkLoader,
  createArtworkImageLoader: createImageLoader,
  createArtworkEditionSetLoader,
  updateArtworkEditionSetLoader,
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
        updateArtworkLoader: failureLoader,
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
      const mutation = computeMutationInput({ externalImageUrls })

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
      const mutation = computeMutationInput({ externalImageUrls })

      const serverError = "Error creating image"
      const url =
        "https://stagingapi.artsy.net/api/v1/artwork/some-artwork-id/images"
      const error = new Error(`${url} - {"error":"${serverError}"}`)
      const failureLoader = jest.fn().mockRejectedValue(error)

      const context = {
        ...defaultContext,
        createArtworkImageLoader: failureLoader,
      }

      const data = await runAuthenticatedQuery(mutation, context)
      const { artworkOrError } = data.myCollectionUpdateArtwork
      const { message } = artworkOrError.mutationError

      expect(message).toEqual(serverError)
    })

    it("creates additional images in sequence to avoid a gravity race condition", async () => {
      // allow us to resolve the createImageLoader mock manually
      let resolveCreateImageLoader = () => null as any
      createImageLoader.mockImplementation(
        () =>
          new Promise<void>((resolve) => (resolveCreateImageLoader = resolve))
      )

      const externalImageUrls = [
        "https://test-upload-bucket.s3.amazonaws.com/path/to/image.jpg",
        "https://test-upload-bucket.s3.amazonaws.com/path/to/other/image.jpg",
      ]
      const mutation = computeMutationInput({ externalImageUrls })

      runAuthenticatedQuery(mutation, defaultContext)

      // flush promise queue
      await new Promise((resolve) => setTimeout(resolve, 0))

      expect(createImageLoader).toHaveBeenCalledTimes(1)
      expect(createImageLoader).toBeCalledWith(updatedArtwork.id, {
        source_bucket: "test-upload-bucket",
        source_key: "path/to/image.jpg",
      })

      resolveCreateImageLoader()

      // flush promise queue
      await new Promise((resolve) => setTimeout(resolve, 0))

      expect(createImageLoader).toHaveBeenCalledTimes(2)
      expect(createImageLoader).toBeCalledWith(updatedArtwork.id, {
        source_bucket: "test-upload-bucket",
        source_key: "path/to/other/image.jpg",
      })
    })
  })

  describe("setting edition set info on an artwork with no edition set info", () => {
    it("creates an edition set on the artwork", async () => {
      const mutation = computeMutationInput({
        editionNumber: "50",
        editionSize: "100",
      })

      await runAuthenticatedQuery(mutation, defaultContext)

      expect(createArtworkEditionSetLoader).toHaveBeenCalledWith(
        updatedArtwork.id,
        {
          edition_size: "100",
          available_editions: ["50"],
        }
      )
    })

    it("works if you only specify the edition number", async () => {
      const mutation = computeMutationInput({
        editionNumber: "50",
      })

      await runAuthenticatedQuery(mutation, defaultContext)

      expect(createArtworkEditionSetLoader).toHaveBeenCalledWith(
        updatedArtwork.id,
        {
          edition_size: null,
          available_editions: ["50"],
        }
      )
    })

    it("works if you only specify the edition size", async () => {
      const mutation = computeMutationInput({
        editionSize: "50",
      })

      await runAuthenticatedQuery(mutation, defaultContext)

      expect(createArtworkEditionSetLoader).toHaveBeenCalledWith(
        updatedArtwork.id,
        {
          edition_size: "50",
          available_editions: null,
        }
      )
    })

    it("does not create an edition set if you don't specify either", async () => {
      const mutation = computeMutationInput({
        editionNumber: null,
        editionSize: null,
      })

      await runAuthenticatedQuery(mutation, defaultContext)

      expect(createArtworkEditionSetLoader).not.toHaveBeenCalled()
    })
  })

  describe("setting edition set info on an artwork with existing edition set info", () => {
    const editionedArtwork = {
      ...updatedArtwork,

      edition_sets: [{ id: "my-edition-set-id" }],
    }
    beforeEach(() => {
      updateArtworkLoader.mockResolvedValueOnce(editionedArtwork)
    })

    it("updates the edition set on the artwork", async () => {
      const mutation = computeMutationInput({
        editionNumber: "50",
        editionSize: "100",
      })

      await runAuthenticatedQuery(mutation, defaultContext)

      expect(updateArtworkEditionSetLoader).toHaveBeenCalledWith(
        {
          artworkId: updatedArtwork.id,
          editionSetId: editionedArtwork.edition_sets[0].id,
        },
        {
          edition_size: "100",
          available_editions: ["50"],
        }
      )
    })

    it("works if you only specify the edition number", async () => {
      const mutation = computeMutationInput({
        editionNumber: "50",
      })

      await runAuthenticatedQuery(mutation, defaultContext)

      expect(updateArtworkEditionSetLoader).toHaveBeenCalledWith(
        {
          artworkId: updatedArtwork.id,
          editionSetId: editionedArtwork.edition_sets[0].id,
        },
        {
          edition_size: null,
          available_editions: ["50"],
        }
      )
    })

    it("works if you only specify the edition size", async () => {
      const mutation = computeMutationInput({
        editionSize: "50",
      })

      await runAuthenticatedQuery(mutation, defaultContext)

      expect(updateArtworkEditionSetLoader).toHaveBeenCalledWith(
        {
          artworkId: updatedArtwork.id,
          editionSetId: editionedArtwork.edition_sets[0].id,
        },
        {
          edition_size: "50",
          available_editions: null,
        }
      )
    })

    it("resets the edition set if you don't specify either", async () => {
      const mutation = computeMutationInput({
        editionNumber: null,
        editionSize: null,
      })

      await runAuthenticatedQuery(mutation, defaultContext)

      expect(updateArtworkEditionSetLoader).toHaveBeenCalledWith(
        {
          artworkId: updatedArtwork.id,
          editionSetId: editionedArtwork.edition_sets[0].id,
        },
        {
          edition_size: null,
          available_editions: null,
        }
      )
    })
  })
})
