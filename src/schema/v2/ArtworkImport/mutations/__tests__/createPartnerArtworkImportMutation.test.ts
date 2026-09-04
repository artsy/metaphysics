import gql from "lib/gql"
import { runAuthenticatedQuery } from "schema/v2/test/utils"

describe("CreatePartnerArtworkImportMutation", () => {
  const mutation = gql`
    mutation {
      createPartnerArtworkImport(
        input: {
          partnerID: "partner-1"
          s3Bucket: "artsy-media"
          s3Key: "uploads/spreadsheet.xlsx"
          fileName: "spreadsheet.xlsx"
          conversionMetadata: {
            saleSlug: "some-auction"
            templateName: "Forum Auctions"
          }
        }
      ) {
        artworkImportOrError {
          ... on CreatePartnerArtworkImportSuccess {
            queued
          }
          ... on CreatePartnerArtworkImportFailure {
            mutationError {
              type
              message
            }
          }
        }
      }
    }
  `

  it("queues a partner artwork import conversion job", async () => {
    const createPartnerArtworkImportLoader = jest.fn().mockResolvedValue({
      queued: true,
    })

    const context = { createPartnerArtworkImportLoader }
    const result = await runAuthenticatedQuery(mutation, context)

    expect(createPartnerArtworkImportLoader).toHaveBeenCalledWith({
      partner_id: "partner-1",
      s3_bucket: "artsy-media",
      s3_key: "uploads/spreadsheet.xlsx",
      file_name: "spreadsheet.xlsx",
      location_id: undefined,
      partner_list_id: undefined,
      conversion_metadata: {
        sale_slug: "some-auction",
        template_name: "Forum Auctions",
      },
    })

    expect(result).toEqual({
      createPartnerArtworkImport: {
        artworkImportOrError: {
          queued: true,
        },
      },
    })
  })

  it("handles errors gracefully", async () => {
    const createPartnerArtworkImportLoader = jest.fn().mockRejectedValue({
      body: {
        type: "param_error",
        message: "Partner not found",
      },
    })

    const context = { createPartnerArtworkImportLoader }
    const result = await runAuthenticatedQuery(mutation, context)

    expect(result).toEqual({
      createPartnerArtworkImport: {
        artworkImportOrError: {
          mutationError: {
            type: "param_error",
            message: "Partner not found",
          },
        },
      },
    })
  })

  it("requires an X-Access-Token header", async () => {
    const context = { createPartnerArtworkImportLoader: undefined }

    await expect(runAuthenticatedQuery(mutation, context)).rejects.toThrow(
      "This operation requires an `X-Access-Token` header."
    )
  })
})
