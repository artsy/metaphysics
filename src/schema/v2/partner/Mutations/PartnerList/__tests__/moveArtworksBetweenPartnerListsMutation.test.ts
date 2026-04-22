import gql from "lib/gql"
import { runAuthenticatedQuery } from "schema/v2/test/utils"

describe("MoveArtworksBetweenPartnerListsMutation", () => {
  const mutation = gql`
    mutation {
      moveArtworksBetweenPartnerLists(
        input: {
          sourceListId: "list-source"
          destinationListId: "list-dest"
          artworkIds: ["artwork-1", "artwork-2"]
        }
      ) {
        partnerListOrError {
          __typename
          ... on MoveArtworksBetweenPartnerListsSuccess {
            partnerList {
              internalID
              name
              artworksCount
            }
          }
          ... on MoveArtworksBetweenPartnerListsFailure {
            mutationError {
              message
            }
          }
        }
      }
    }
  `

  it("moves artworks to the destination list", async () => {
    const context = {
      moveArtworksBetweenPartnerListsLoader: jest.fn().mockResolvedValue({}),
      partnerListLoader: jest.fn().mockResolvedValue({
        id: "list-dest",
        name: "Destination List",
        list_type: "other",
        artworks_count: 2,
        created_at: "2026-01-01T00:00:00+00:00",
        updated_at: "2026-01-01T00:00:00+00:00",
      }),
    }

    const result = await runAuthenticatedQuery(mutation, context)

    expect(
      context.moveArtworksBetweenPartnerListsLoader
    ).toHaveBeenCalledWith("list-source", {
      destination_partner_list_id: "list-dest",
      artwork_ids: ["artwork-1", "artwork-2"],
    })
    expect(context.partnerListLoader).toHaveBeenCalledWith("list-dest")

    expect(result).toEqual({
      moveArtworksBetweenPartnerLists: {
        partnerListOrError: {
          __typename: "MoveArtworksBetweenPartnerListsSuccess",
          partnerList: {
            internalID: "list-dest",
            name: "Destination List",
            artworksCount: 2,
          },
        },
      },
    })
  })

  it("returns a mutation error on failure", async () => {
    const context = {
      moveArtworksBetweenPartnerListsLoader: jest.fn().mockRejectedValue({
        body: { message: "Lists must belong to the same partner" },
      }),
      partnerListLoader: jest.fn(),
    }

    const result = await runAuthenticatedQuery(mutation, context)

    expect(result).toEqual({
      moveArtworksBetweenPartnerLists: {
        partnerListOrError: {
          __typename: "MoveArtworksBetweenPartnerListsFailure",
          mutationError: {
            message: "Lists must belong to the same partner",
          },
        },
      },
    })
  })

  it("throws when not authenticated", async () => {
    await expect(
      runAuthenticatedQuery(mutation, {
        moveArtworksBetweenPartnerListsLoader: undefined,
        partnerListLoader: undefined,
      })
    ).rejects.toThrow("You need to be signed in to perform this action")
  })
})
