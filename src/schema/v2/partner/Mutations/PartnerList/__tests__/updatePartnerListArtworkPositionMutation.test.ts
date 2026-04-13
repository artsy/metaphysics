import gql from "lib/gql"
import { runAuthenticatedQuery } from "schema/v2/test/utils"

describe("UpdatePartnerListArtworkPositionMutation", () => {
  const mutation = gql`
    mutation {
      updatePartnerListArtworkPosition(
        input: { listId: "list-abc", artworkId: "artwork-123", position: 2 }
      ) {
        partnerListOrError {
          __typename
          ... on UpdatePartnerListArtworkPositionSuccess {
            partnerList {
              internalID
              name
            }
          }
          ... on UpdatePartnerListArtworkPositionFailure {
            mutationError {
              message
            }
          }
        }
      }
    }
  `

  it("updates the position of an artwork in a partner list", async () => {
    const context = {
      updatePartnerListArtworkLoader: jest.fn().mockResolvedValue({}),
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

    expect(context.updatePartnerListArtworkLoader).toHaveBeenCalledWith(
      { listId: "list-abc", artworkId: "artwork-123" },
      { position: 2 }
    )
    expect(context.partnerListLoader).toHaveBeenCalledWith("list-abc")

    expect(result).toEqual({
      updatePartnerListArtworkPosition: {
        partnerListOrError: {
          __typename: "UpdatePartnerListArtworkPositionSuccess",
          partnerList: {
            internalID: "list-abc",
            name: "Spring 2026 Show",
          },
        },
      },
    })
  })

  it("returns a mutation error on failure", async () => {
    const context = {
      updatePartnerListArtworkLoader: jest.fn().mockRejectedValue({
        body: { message: "Artwork not in list" },
      }),
      partnerListLoader: jest.fn(),
    }

    const result = await runAuthenticatedQuery(mutation, context)

    expect(result).toEqual({
      updatePartnerListArtworkPosition: {
        partnerListOrError: {
          __typename: "UpdatePartnerListArtworkPositionFailure",
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
        updatePartnerListArtworkLoader: undefined,
        partnerListLoader: undefined,
      })
    ).rejects.toThrow("You need to be signed in to perform this action")
  })
})
