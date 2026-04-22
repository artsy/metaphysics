import gql from "lib/gql"
import { runAuthenticatedQuery } from "schema/v2/test/utils"

describe("BulkDeleteArtworksFromPartnerListMutation", () => {
  const mutation = gql`
    mutation {
      bulkDeleteArtworksFromPartnerList(
        input: {
          listId: "list-abc"
          artworkIds: ["artwork-1", "artwork-2"]
        }
      ) {
        partnerListOrError {
          __typename
          ... on BulkDeleteArtworksFromPartnerListSuccess {
            partnerList {
              internalID
              name
              artworksCount
            }
          }
          ... on BulkDeleteArtworksFromPartnerListFailure {
            mutationError {
              message
            }
          }
        }
      }
    }
  `

  it("bulk removes artworks from a partner list", async () => {
    const context = {
      bulkDeleteArtworksFromPartnerListLoader: jest.fn().mockResolvedValue({}),
      partnerListLoader: jest.fn().mockResolvedValue({
        id: "list-abc",
        name: "Spring 2026 Show",
        list_type: "show",
        artworks_count: 1,
        created_at: "2026-01-01T00:00:00+00:00",
        updated_at: "2026-01-01T00:00:00+00:00",
      }),
    }

    const result = await runAuthenticatedQuery(mutation, context)

    expect(
      context.bulkDeleteArtworksFromPartnerListLoader
    ).toHaveBeenCalledWith("list-abc", {
      artwork_ids: ["artwork-1", "artwork-2"],
    })
    expect(context.partnerListLoader).toHaveBeenCalledWith("list-abc")

    expect(result).toEqual({
      bulkDeleteArtworksFromPartnerList: {
        partnerListOrError: {
          __typename: "BulkDeleteArtworksFromPartnerListSuccess",
          partnerList: {
            internalID: "list-abc",
            name: "Spring 2026 Show",
            artworksCount: 1,
          },
        },
      },
    })
  })

  it("returns a mutation error on failure", async () => {
    const context = {
      bulkDeleteArtworksFromPartnerListLoader: jest.fn().mockRejectedValue({
        body: { message: "Partner list not found" },
      }),
      partnerListLoader: jest.fn(),
    }

    const result = await runAuthenticatedQuery(mutation, context)

    expect(result).toEqual({
      bulkDeleteArtworksFromPartnerList: {
        partnerListOrError: {
          __typename: "BulkDeleteArtworksFromPartnerListFailure",
          mutationError: {
            message: "Partner list not found",
          },
        },
      },
    })
  })

  it("throws when not authenticated", async () => {
    await expect(
      runAuthenticatedQuery(mutation, {
        bulkDeleteArtworksFromPartnerListLoader: undefined,
        partnerListLoader: undefined,
      })
    ).rejects.toThrow("You need to be signed in to perform this action")
  })
})
