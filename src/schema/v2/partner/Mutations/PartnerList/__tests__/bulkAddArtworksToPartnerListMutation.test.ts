import gql from "lib/gql"
import { runAuthenticatedQuery } from "schema/v2/test/utils"

describe("BulkAddArtworksToPartnerListMutation", () => {
  const mutation = gql`
    mutation {
      bulkAddArtworksToPartnerList(
        input: {
          listId: "list-abc"
          artworkIds: ["artwork-1", "artwork-2", "artwork-3"]
        }
      ) {
        partnerListOrError {
          __typename
          ... on BulkAddArtworksToPartnerListSuccess {
            partnerList {
              internalID
              name
              artworksCount
            }
          }
          ... on BulkAddArtworksToPartnerListFailure {
            mutationError {
              message
            }
          }
        }
      }
    }
  `

  it("bulk adds artworks to a partner list", async () => {
    const context = {
      bulkAddArtworksToPartnerListLoader: jest.fn().mockResolvedValue({}),
      partnerListLoader: jest.fn().mockResolvedValue({
        id: "list-abc",
        name: "Spring 2026 Show",
        list_type: "show",
        artworks_count: 3,
        created_at: "2026-01-01T00:00:00+00:00",
        updated_at: "2026-01-01T00:00:00+00:00",
      }),
    }

    const result = await runAuthenticatedQuery(mutation, context)

    expect(context.bulkAddArtworksToPartnerListLoader).toHaveBeenCalledWith(
      "list-abc",
      {
        artwork_ids: ["artwork-1", "artwork-2", "artwork-3"],
      }
    )
    expect(context.partnerListLoader).toHaveBeenCalledWith("list-abc")

    expect(result).toEqual({
      bulkAddArtworksToPartnerList: {
        partnerListOrError: {
          __typename: "BulkAddArtworksToPartnerListSuccess",
          partnerList: {
            internalID: "list-abc",
            name: "Spring 2026 Show",
            artworksCount: 3,
          },
        },
      },
    })
  })

  it("returns a mutation error on failure", async () => {
    const context = {
      bulkAddArtworksToPartnerListLoader: jest.fn().mockRejectedValue({
        body: { message: "Some artworks not found" },
      }),
      partnerListLoader: jest.fn(),
    }

    const result = await runAuthenticatedQuery(mutation, context)

    expect(result).toEqual({
      bulkAddArtworksToPartnerList: {
        partnerListOrError: {
          __typename: "BulkAddArtworksToPartnerListFailure",
          mutationError: {
            message: "Some artworks not found",
          },
        },
      },
    })
  })

  it("throws when not authenticated", async () => {
    await expect(
      runAuthenticatedQuery(mutation, {
        bulkAddArtworksToPartnerListLoader: undefined,
        partnerListLoader: undefined,
      })
    ).rejects.toThrow("You need to be signed in to perform this action")
  })
})
