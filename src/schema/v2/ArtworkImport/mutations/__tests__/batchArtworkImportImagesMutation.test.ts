import gql from "lib/gql"
import { runAuthenticatedQuery } from "schema/v2/test/utils"

describe("BatchArtworkImportImagesMutation", () => {
  it("matches multiple images for a row", async () => {
    const artworkImportMatchImagesLoader = jest.fn().mockResolvedValue({
      id: "artwork-import-id",
    })

    const mutation = gql`
      mutation {
        batchArtworkImportImages(
          input: {
            artworkImportID: "artwork-import-1"
            images: [
              {
                fileName: "cat.jpg"
                s3Key: "/some/path/cat.jpg"
                s3Bucket: "someBucket"
                rowID: "row-1"
              }
              {
                fileName: "dog.jpg"
                s3Key: "/some/path/dog.jpg"
                s3Bucket: "someBucket"
                rowID: "row-1"
              }
            ]
          }
        ) {
          batchArtworkImportImagesOrError {
            ... on BatchArtworkImportImagesSuccess {
              success
            }
          }
        }
      }
    `

    const context = {
      artworkImportMatchImagesLoader,
      artworkImportLoader: jest
        .fn()
        .mockResolvedValue({ id: "artwork-import-1" }),
    }
    const result = await runAuthenticatedQuery(mutation, context)

    expect(artworkImportMatchImagesLoader).toHaveBeenCalledWith(
      "artwork-import-1",
      {
        images: [
          {
            file_name: "cat.jpg",
            s3_key: "/some/path/cat.jpg",
            s3_bucket: "someBucket",
            row_id: "row-1",
          },
          {
            file_name: "dog.jpg",
            s3_key: "/some/path/dog.jpg",
            s3_bucket: "someBucket",
            row_id: "row-1",
          },
        ],
      }
    )

    expect(result).toEqual({
      batchArtworkImportImages: {
        batchArtworkImportImagesOrError: {
          success: true,
        },
      },
    })
  })

  it("matches multiple images without rowID", async () => {
    const artworkImportMatchImagesLoader = jest.fn().mockResolvedValue({
      id: "artwork-import-id",
    })

    const mutation = gql`
      mutation {
        batchArtworkImportImages(
          input: {
            artworkImportID: "artwork-import-1"
            images: [
              {
                fileName: "existing.jpg"
                s3Key: "/new/path/existing.jpg"
                s3Bucket: "newBucket"
              }
            ]
          }
        ) {
          batchArtworkImportImagesOrError {
            ... on BatchArtworkImportImagesSuccess {
              success
            }
          }
        }
      }
    `

    const context = {
      artworkImportMatchImagesLoader,
      artworkImportLoader: jest
        .fn()
        .mockResolvedValue({ id: "artwork-import-1" }),
    }
    const result = await runAuthenticatedQuery(mutation, context)

    expect(artworkImportMatchImagesLoader).toHaveBeenCalledWith(
      "artwork-import-1",
      {
        images: [
          {
            file_name: "existing.jpg",
            s3_key: "/new/path/existing.jpg",
            s3_bucket: "newBucket",
          },
        ],
      }
    )

    expect(result).toEqual({
      batchArtworkImportImages: {
        batchArtworkImportImagesOrError: {
          success: true,
        },
      },
    })
  })

  it("handles errors gracefully", async () => {
    const artworkImportMatchImagesLoader = jest
      .fn()
      .mockRejectedValue(new Error("Service error"))

    const mutation = gql`
      mutation {
        batchArtworkImportImages(
          input: {
            artworkImportID: "artwork-import-1"
            images: [
              {
                fileName: "test.jpg"
                s3Key: "/path/test.jpg"
                s3Bucket: "bucket"
              }
            ]
          }
        ) {
          batchArtworkImportImagesOrError {
            ... on BatchArtworkImportImagesFailure {
              mutationError {
                message
              }
            }
          }
        }
      }
    `

    const context = {
      artworkImportMatchImagesLoader,
      artworkImportLoader: jest
        .fn()
        .mockResolvedValue({ id: "artwork-import-1" }),
    }

    await expect(runAuthenticatedQuery(mutation, context)).rejects.toThrow(
      "Service error"
    )
  })
})
