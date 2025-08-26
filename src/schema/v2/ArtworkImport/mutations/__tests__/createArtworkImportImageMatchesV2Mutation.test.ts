import gql from "lib/gql"
import { runAuthenticatedQuery } from "schema/v2/test/utils"

describe("CreateArtworkImportImageMatchesV2Mutation", () => {
  it("creates image match successfully", async () => {
    const artworkImportV2CreateImageMatchesLoader = jest
      .fn()
      .mockResolvedValue({
        id: "image-match-1",
        success: true,
      })
    const artworkImportLoader = jest.fn().mockResolvedValue({
      id: "artwork-import-1",
    })

    const mutation = gql`
      mutation {
        createArtworkImportImageMatchesV2(
          input: {
            artworkImportID: "artwork-import-1"
            fileName: "artwork.jpg"
            s3Key: "uploads/artwork.jpg"
            s3Bucket: "artsy-images"
            rowID: "row-123"
          }
        ) {
          createArtworkImportImageMatchesV2OrError {
            ... on CreateArtworkImportImageMatchesV2Success {
              success
              artworkImport {
                internalID
              }
            }
          }
        }
      }
    `

    const context = {
      artworkImportV2CreateImageMatchesLoader,
      artworkImportLoader,
    }
    const result = await runAuthenticatedQuery(mutation, context)

    expect(artworkImportV2CreateImageMatchesLoader).toHaveBeenCalledWith(
      "artwork-import-1",
      {
        file_name: "artwork.jpg",
        s3_key: "uploads/artwork.jpg",
        s3_bucket: "artsy-images",
        row_id: "row-123",
      }
    )

    expect(result).toEqual({
      createArtworkImportImageMatchesV2: {
        createArtworkImportImageMatchesV2OrError: {
          success: true,
          artworkImport: {
            internalID: "artwork-import-1",
          },
        },
      },
    })
  })

  it("handles different image formats", async () => {
    const artworkImportV2CreateImageMatchesLoader = jest
      .fn()
      .mockResolvedValue({
        id: "image-match-2",
        success: true,
      })
    const artworkImportLoader = jest.fn().mockResolvedValue({
      id: "artwork-import-1",
    })

    const mutation = gql`
      mutation {
        createArtworkImportImageMatchesV2(
          input: {
            artworkImportID: "artwork-import-1"
            fileName: "sculpture.png"
            s3Key: "uploads/sculpture.png"
            s3Bucket: "artsy-images-staging"
            rowID: "row-456"
          }
        ) {
          createArtworkImportImageMatchesV2OrError {
            ... on CreateArtworkImportImageMatchesV2Success {
              success
            }
          }
        }
      }
    `

    const context = {
      artworkImportV2CreateImageMatchesLoader,
      artworkImportLoader,
    }
    const result = await runAuthenticatedQuery(mutation, context)

    expect(artworkImportV2CreateImageMatchesLoader).toHaveBeenCalledWith(
      "artwork-import-1",
      {
        file_name: "sculpture.png",
        s3_key: "uploads/sculpture.png",
        s3_bucket: "artsy-images-staging",
        row_id: "row-456",
      }
    )

    expect(result).toEqual({
      createArtworkImportImageMatchesV2: {
        createArtworkImportImageMatchesV2OrError: {
          success: true,
        },
      },
    })
  })
})
