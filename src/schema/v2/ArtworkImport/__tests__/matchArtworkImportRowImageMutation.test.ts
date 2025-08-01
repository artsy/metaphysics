import gql from "lib/gql"
import { runAuthenticatedQuery } from "schema/v2/test/utils"

describe("MatchArtworkImportRowImageMutation", () => {
  it("updates a row's image based on filename", async () => {
    const artworkImportRowMatchImageLoader = jest.fn().mockResolvedValue({
      id: "artwork-import-id",
    })

    const mutation = gql`
      mutation {
        matchArtworkImportRowImage(
          input: {
            artworkImportID: "artwork-import-1"
            fileName: "cat.jpg"
            s3Key: "/some/path/cat.jpg"
            s3Bucket: "someBucket"
          }
        ) {
          matchArtworkImportRowImageOrError {
            ... on MatchArtworkImportRowImageSuccess {
              success
            }
          }
        }
      }
    `

    const context = {
      artworkImportRowMatchImageLoader,
    }
    const result = await runAuthenticatedQuery(mutation, context)

    expect(artworkImportRowMatchImageLoader).toHaveBeenCalledWith(
      "artwork-import-1",
      {
        file_name: "cat.jpg",
        s3_key: "/some/path/cat.jpg",
        s3_bucket: "someBucket",
      }
    )

    expect(result).toEqual({
      matchArtworkImportRowImage: {
        matchArtworkImportRowImageOrError: {
          success: true,
        },
      },
    })
  })

  it("updates a row's image with rowID when provided", async () => {
    const artworkImportRowMatchImageLoader = jest.fn().mockResolvedValue({
      id: "artwork-import-id",
    })

    const mutation = gql`
      mutation {
        matchArtworkImportRowImage(
          input: {
            artworkImportID: "artwork-import-1"
            fileName: "cat.jpg"
            s3Key: "/some/path/cat.jpg"
            s3Bucket: "someBucket"
            rowID: "row-123"
          }
        ) {
          matchArtworkImportRowImageOrError {
            ... on MatchArtworkImportRowImageSuccess {
              success
            }
          }
        }
      }
    `

    const context = {
      artworkImportRowMatchImageLoader,
    }
    const result = await runAuthenticatedQuery(mutation, context)

    expect(artworkImportRowMatchImageLoader).toHaveBeenCalledWith(
      "artwork-import-1",
      {
        file_name: "cat.jpg",
        s3_key: "/some/path/cat.jpg",
        s3_bucket: "someBucket",
        row_id: "row-123",
      }
    )

    expect(result).toEqual({
      matchArtworkImportRowImage: {
        matchArtworkImportRowImageOrError: {
          success: true,
        },
      },
    })
  })
})
