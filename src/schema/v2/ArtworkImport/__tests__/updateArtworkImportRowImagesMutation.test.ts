import gql from "lib/gql"
import { runAuthenticatedQuery } from "schema/v2/test/utils"

describe("UpdateArtworkImportRowImagesMutation", () => {
  it("updates multiple image positions", async () => {
    const artworkImportUpdateRowImagesLoader = jest.fn().mockResolvedValue({
      images: [
        { id: "image-3", position: 0 },
        { id: "image-2", position: 1 },
        { id: "image-1", position: 2 },
      ],
    })

    const mutation = gql`
      mutation {
        updateArtworkImportRowImages(
          input: {
            artworkImportID: "artwork-import-1"
            rowID: "row-1"
            sortedImageIDs: ["image-3", "image-2", "image-1"]
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
      artworkImportUpdateRowImagesLoader,
      artworkImportLoader: jest
        .fn()
        .mockResolvedValue({ id: "artwork-import-1" }),
    }
    const result = await runAuthenticatedQuery(mutation, context)

    expect(artworkImportUpdateRowImagesLoader).toHaveBeenCalledWith(
      { artworkImportID: "artwork-import-1", rowID: "row-1" },
      {
        sorted_image_ids: ["image-3", "image-2", "image-1"],
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
    const artworkImportUpdateRowImagesLoader = jest.fn().mockResolvedValue({
      images: [{ id: "image-1", position: 0 }],
    })

    const mutation = gql`
      mutation {
        updateArtworkImportRowImages(
          input: {
            artworkImportID: "artwork-import-1"
            rowID: "row-1"
            sortedImageIDs: ["image-1"]
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
      artworkImportUpdateRowImagesLoader,
      artworkImportLoader: jest
        .fn()
        .mockResolvedValue({ id: "artwork-import-1" }),
    }
    const result = await runAuthenticatedQuery(mutation, context)

    expect(artworkImportUpdateRowImagesLoader).toHaveBeenCalledWith(
      { artworkImportID: "artwork-import-1", rowID: "row-1" },
      {
        sorted_image_ids: ["image-1"],
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
    const artworkImportUpdateRowImagesLoader = jest
      .fn()
      .mockRejectedValue(new Error("Batch update failed"))

    const mutation = gql`
      mutation {
        updateArtworkImportRowImages(
          input: {
            artworkImportID: "artwork-import-1"
            rowID: "row-1"
            sortedImageIDs: ["image-1"]
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
      artworkImportUpdateRowImagesLoader,
      artworkImportLoader: jest
        .fn()
        .mockResolvedValue({ id: "artwork-import-1" }),
    }

    await expect(runAuthenticatedQuery(mutation, context)).rejects.toThrow(
      "Batch update failed"
    )
  })
})
