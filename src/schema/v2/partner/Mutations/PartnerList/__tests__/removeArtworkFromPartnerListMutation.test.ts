import gql from "lib/gql"
import { runAuthenticatedQuery } from "schema/v2/test/utils"

describe("RemoveArtworkFromPartnerListMutation", () => {
  const mutation = gql`
    mutation {
      removeArtworkFromPartnerList(
        input: { listId: "list-abc", artworkId: "artwork-123" }
      ) {
        partnerListOrError {
          __typename
          ... on RemoveArtworkFromPartnerListSuccess {
            partnerList {
              internalID
              name
              artworksCount
            }
          }
          ... on RemoveArtworkFromPartnerListFailure {
            mutationError {
              message
            }
          }
        }
      }
    }
  `

  it("removes an artwork from a partner list", async () => {
    const context = {
      removeArtworkFromPartnerListLoader: jest.fn().mockResolvedValue({}),
      partnerListLoader: jest.fn().mockResolvedValue({
        id: "list-abc",
        name: "Spring 2026 Show",
        list_type: "show",
        artworks_count: 0,
        created_at: "2026-01-01T00:00:00+00:00",
        updated_at: "2026-01-01T00:00:00+00:00",
      }),
    }

    const result = await runAuthenticatedQuery(mutation, context)

    expect(context.removeArtworkFromPartnerListLoader).toHaveBeenCalledWith({
      listId: "list-abc",
      artworkId: "artwork-123",
    })
    expect(context.partnerListLoader).toHaveBeenCalledWith("list-abc")

    expect(result).toEqual({
      removeArtworkFromPartnerList: {
        partnerListOrError: {
          __typename: "RemoveArtworkFromPartnerListSuccess",
          partnerList: {
            internalID: "list-abc",
            name: "Spring 2026 Show",
            artworksCount: 0,
          },
        },
      },
    })
  })

  it("returns a mutation error on failure", async () => {
    const context = {
      removeArtworkFromPartnerListLoader: jest.fn().mockRejectedValue({
        body: { message: "Artwork not in list" },
      }),
      partnerListLoader: jest.fn(),
    }

    const result = await runAuthenticatedQuery(mutation, context)

    expect(result).toEqual({
      removeArtworkFromPartnerList: {
        partnerListOrError: {
          __typename: "RemoveArtworkFromPartnerListFailure",
          mutationError: {
            message: "Artwork not in list",
          },
        },
      },
    })
  })

  it("throws when not authenticated", async () => {
    await expect(
      runAuthenticatedQuery(mutation, {
        removeArtworkFromPartnerListLoader: undefined,
        partnerListLoader: undefined,
      })
    ).rejects.toThrow("You need to be signed in to perform this action")
  })
})
