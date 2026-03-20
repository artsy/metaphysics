import gql from "lib/gql"
import { runAuthenticatedQuery } from "schema/v2/test/utils"

describe("CreatePartnerArtworksExportMutation", () => {
  const mutation = gql`
    mutation {
      createPartnerArtworksExport(input: { partnerId: "partner-123" }) {
        partnerArtworksExportOrError {
          __typename
          ... on CreatePartnerArtworksExportSuccess {
            exportId
          }
          ... on CreatePartnerArtworksExportFailure {
            mutationError {
              message
            }
          }
        }
      }
    }
  `

  it("enqueues an artwork export and returns the export ID", async () => {
    const context = {
      createPartnerArtworksExportLoader: jest
        .fn()
        .mockResolvedValue({ id: "export-uuid-123" }),
    }

    const result = await runAuthenticatedQuery(mutation, context)

    expect(context.createPartnerArtworksExportLoader).toHaveBeenCalledWith(
      "partner-123",
      {}
    )
    expect(result).toEqual({
      createPartnerArtworksExport: {
        partnerArtworksExportOrError: {
          __typename: "CreatePartnerArtworksExportSuccess",
          exportId: "export-uuid-123",
        },
      },
    })
  })

  it("passes artwork_ids to the loader when artworkIds is provided", async () => {
    const mutationWithIds = gql`
      mutation {
        createPartnerArtworksExport(
          input: {
            partnerId: "partner-123"
            artworkIds: ["artwork-1", "artwork-2"]
          }
        ) {
          partnerArtworksExportOrError {
            ... on CreatePartnerArtworksExportSuccess {
              exportId
            }
          }
        }
      }
    `

    const context = {
      createPartnerArtworksExportLoader: jest
        .fn()
        .mockResolvedValue({ id: "export-uuid-123" }),
    }

    await runAuthenticatedQuery(mutationWithIds, context)

    expect(context.createPartnerArtworksExportLoader).toHaveBeenCalledWith(
      "partner-123",
      {
        artwork_ids: ["artwork-1", "artwork-2"],
      }
    )
  })

  it("returns a mutation error on failure", async () => {
    const context = {
      createPartnerArtworksExportLoader: jest.fn().mockRejectedValue({
        body: { message: "Partner not found" },
      }),
    }

    const result = await runAuthenticatedQuery(mutation, context)

    expect(result).toEqual({
      createPartnerArtworksExport: {
        partnerArtworksExportOrError: {
          __typename: "CreatePartnerArtworksExportFailure",
          mutationError: {
            message: "Partner not found",
          },
        },
      },
    })
  })

  it("throws when not authenticated", async () => {
    await expect(
      runAuthenticatedQuery(mutation, {
        createPartnerArtworksExportLoader: undefined,
      })
    ).rejects.toThrow("You need to be signed in to perform this action")
  })
})
