import gql from "lib/gql"
import { runAuthenticatedQuery } from "schema/v2/test/utils"

describe("AddArtworkToPartnerListMutation", () => {
  const mutation = gql`
    mutation {
      addArtworkToPartnerList(
        input: { listId: "list-abc", artworkId: "artwork-123" }
      ) {
        partnerListOrError {
          __typename
          ... on AddArtworkToPartnerListSuccess {
            partnerList {
              internalID
              name
              artworksCount
            }
          }
          ... on AddArtworkToPartnerListFailure {
            mutationError {
              message
            }
          }
        }
      }
    }
  `

  it("adds an artwork to a partner list", async () => {
    const context = {
      addArtworkToPartnerListLoader: jest.fn().mockResolvedValue({}),
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

    expect(context.addArtworkToPartnerListLoader).toHaveBeenCalledWith({
      listId: "list-abc",
      artworkId: "artwork-123",
    })
    expect(context.partnerListLoader).toHaveBeenCalledWith("list-abc")

    expect(result).toEqual({
      addArtworkToPartnerList: {
        partnerListOrError: {
          __typename: "AddArtworkToPartnerListSuccess",
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
      addArtworkToPartnerListLoader: jest.fn().mockRejectedValue({
        body: { message: "Artwork not found" },
      }),
      partnerListLoader: jest.fn(),
    }

    const result = await runAuthenticatedQuery(mutation, context)

    expect(result).toEqual({
      addArtworkToPartnerList: {
        partnerListOrError: {
          __typename: "AddArtworkToPartnerListFailure",
          mutationError: {
            message: "Artwork not found",
          },
        },
      },
    })
  })

  it("throws when not authenticated", async () => {
    await expect(
      runAuthenticatedQuery(mutation, {
        addArtworkToPartnerListLoader: undefined,
        partnerListLoader: undefined,
      })
    ).rejects.toThrow("You need to be signed in to perform this action")
  })
})
