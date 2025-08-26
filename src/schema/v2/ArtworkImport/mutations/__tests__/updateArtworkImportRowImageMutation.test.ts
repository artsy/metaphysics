import gql from "lib/gql"
import { runAuthenticatedQuery } from "schema/v2/test/utils"

describe("UpdateArtworkImportRowImageMutation", () => {
  it("updates a single image position", async () => {
    const artworkImportUpdateImageMatchLoader = jest.fn().mockResolvedValue({
      id: "image-1",
      position: 5,
    })

    const mutation = gql`
      mutation {
        updateArtworkImportRowImage(
          input: {
            artworkImportID: "artwork-import-1"
            imageID: "image-1"
            position: 5
          }
        ) {
          updateArtworkImportRowImageOrError {
            ... on UpdateArtworkImportRowImageSuccess {
              artworkImportID
            }
          }
        }
      }
    `

    const context = {
      artworkImportUpdateImageMatchLoader,
      artworkImportLoader: jest
        .fn()
        .mockResolvedValue({ id: "artwork-import-1" }),
    }
    const result = await runAuthenticatedQuery(mutation, context)

    expect(artworkImportUpdateImageMatchLoader).toHaveBeenCalledWith(
      { artworkImportID: "artwork-import-1", imageID: "image-1" },
      { position: 5 }
    )

    expect(result).toEqual({
      updateArtworkImportRowImage: {
        updateArtworkImportRowImageOrError: {
          artworkImportID: "artwork-import-1",
        },
      },
    })
  })

  it("updates position 0", async () => {
    const artworkImportUpdateImageMatchLoader = jest.fn().mockResolvedValue({
      id: "image-1",
      position: 0,
    })

    const mutation = gql`
      mutation {
        updateArtworkImportRowImage(
          input: {
            artworkImportID: "artwork-import-1"
            imageID: "image-1"
            position: 0
          }
        ) {
          updateArtworkImportRowImageOrError {
            ... on UpdateArtworkImportRowImageSuccess {
              artworkImportID
            }
          }
        }
      }
    `

    const context = {
      artworkImportUpdateImageMatchLoader,
      artworkImportLoader: jest
        .fn()
        .mockResolvedValue({ id: "artwork-import-1" }),
    }
    const result = await runAuthenticatedQuery(mutation, context)

    expect(artworkImportUpdateImageMatchLoader).toHaveBeenCalledWith(
      { artworkImportID: "artwork-import-1", imageID: "image-1" },
      { position: 0 }
    )

    expect(result).toEqual({
      updateArtworkImportRowImage: {
        updateArtworkImportRowImageOrError: {
          artworkImportID: "artwork-import-1",
        },
      },
    })
  })

  it("returns an error when loader throws", async () => {
    const artworkImportUpdateImageMatchLoader = jest
      .fn()
      .mockRejectedValue(new Error("Image not found"))

    const mutation = gql`
      mutation {
        updateArtworkImportRowImage(
          input: {
            artworkImportID: "artwork-import-1"
            imageID: "image-1"
            position: 5
          }
        ) {
          updateArtworkImportRowImageOrError {
            ... on UpdateArtworkImportRowImageSuccess {
              artworkImportID
            }
          }
        }
      }
    `

    const context = {
      artworkImportUpdateImageMatchLoader,
      artworkImportLoader: jest
        .fn()
        .mockResolvedValue({ id: "artwork-import-1" }),
    }

    await expect(runAuthenticatedQuery(mutation, context)).rejects.toThrow(
      "Image not found"
    )
  })
})
