import gql from "lib/gql"
import { runAuthenticatedQuery } from "schema/v2/test/utils"

describe("UpdateArtworkImportRowImagesMutation", () => {
  it("updates multiple image positions", async () => {
    const artworkImportBatchUpdateImageMatchesLoader = jest
      .fn()
      .mockResolvedValue({
        images: [
          { id: "image-1", position: 2 },
          { id: "image-2", position: 1 },
          { id: "image-3", position: 0 },
        ],
      })

    const mutation = gql`
      mutation {
        updateArtworkImportRowImages(
          input: {
            artworkImportID: "artwork-import-1"
            images: [
              { id: "image-1", position: 2 }
              { id: "image-2", position: 1 }
              { id: "image-3", position: 0 }
            ]
          }
        ) {
          updateArtworkImportRowImagesOrError {
            ... on UpdateArtworkImportRowImagesSuccess {
              artworkImportID
            }
          }
        }
      }
    `

    const context = {
      artworkImportBatchUpdateImageMatchesLoader,
      artworkImportLoader: jest
        .fn()
        .mockResolvedValue({ id: "artwork-import-1" }),
    }
    const result = await runAuthenticatedQuery(mutation, context)

    expect(artworkImportBatchUpdateImageMatchesLoader).toHaveBeenCalledWith(
      "artwork-import-1",
      {
        images: [
          { id: "image-1", position: 2 },
          { id: "image-2", position: 1 },
          { id: "image-3", position: 0 },
        ],
      }
    )

    expect(result).toEqual({
      updateArtworkImportRowImages: {
        updateArtworkImportRowImagesOrError: {
          artworkImportID: "artwork-import-1",
        },
      },
    })
  })

  it("handles single image in batch", async () => {
    const artworkImportBatchUpdateImageMatchesLoader = jest
      .fn()
      .mockResolvedValue({
        images: [{ id: "image-1", position: 3 }],
      })

    const mutation = gql`
      mutation {
        updateArtworkImportRowImages(
          input: {
            artworkImportID: "artwork-import-1"
            images: [{ id: "image-1", position: 3 }]
          }
        ) {
          updateArtworkImportRowImagesOrError {
            ... on UpdateArtworkImportRowImagesSuccess {
              artworkImportID
            }
          }
        }
      }
    `

    const context = {
      artworkImportBatchUpdateImageMatchesLoader,
      artworkImportLoader: jest
        .fn()
        .mockResolvedValue({ id: "artwork-import-1" }),
    }
    const result = await runAuthenticatedQuery(mutation, context)

    expect(artworkImportBatchUpdateImageMatchesLoader).toHaveBeenCalledWith(
      "artwork-import-1",
      {
        images: [{ id: "image-1", position: 3 }],
      }
    )

    expect(result).toEqual({
      updateArtworkImportRowImages: {
        updateArtworkImportRowImagesOrError: {
          artworkImportID: "artwork-import-1",
        },
      },
    })
  })

  it("returns an error when loader throws", async () => {
    const artworkImportBatchUpdateImageMatchesLoader = jest
      .fn()
      .mockRejectedValue(new Error("Batch update failed"))

    const mutation = gql`
      mutation {
        updateArtworkImportRowImages(
          input: {
            artworkImportID: "artwork-import-1"
            images: [{ id: "image-1", position: 5 }]
          }
        ) {
          updateArtworkImportRowImagesOrError {
            ... on UpdateArtworkImportRowImagesSuccess {
              artworkImportID
            }
          }
        }
      }
    `

    const context = {
      artworkImportBatchUpdateImageMatchesLoader,
      artworkImportLoader: jest
        .fn()
        .mockResolvedValue({ id: "artwork-import-1" }),
    }

    await expect(runAuthenticatedQuery(mutation, context)).rejects.toThrow(
      "Batch update failed"
    )
  })
})
