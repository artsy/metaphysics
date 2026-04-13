import gql from "lib/gql"
import { runAuthenticatedQuery } from "schema/v2/test/utils"

describe("RepositionPartnerListArtworksMutation", () => {
  const mutation = gql`
    mutation {
      repositionPartnerListArtworks(
        input: {
          listId: "list-abc"
          artworkIds: ["artwork-3", "artwork-1", "artwork-2"]
        }
      ) {
        partnerListOrError {
          __typename
          ... on RepositionPartnerListArtworksSuccess {
            partnerList {
              internalID
              name
            }
          }
          ... on RepositionPartnerListArtworksFailure {
            mutationError {
              message
            }
          }
        }
      }
    }
  `

  it("repositions artworks in a partner list", async () => {
    const context = {
      repositionPartnerListArtworksLoader: jest.fn().mockResolvedValue({}),
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

    expect(context.repositionPartnerListArtworksLoader).toHaveBeenCalledWith(
      "list-abc",
      {
        artwork_ids: ["artwork-3", "artwork-1", "artwork-2"],
      }
    )
    expect(context.partnerListLoader).toHaveBeenCalledWith("list-abc")

    expect(result).toEqual({
      repositionPartnerListArtworks: {
        partnerListOrError: {
          __typename: "RepositionPartnerListArtworksSuccess",
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
      repositionPartnerListArtworksLoader: jest.fn().mockRejectedValue({
        body: { message: "Invalid artwork IDs" },
      }),
      partnerListLoader: jest.fn(),
    }

    const result = await runAuthenticatedQuery(mutation, context)

    expect(result).toEqual({
      repositionPartnerListArtworks: {
        partnerListOrError: {
          __typename: "RepositionPartnerListArtworksFailure",
          mutationError: {
            message: "Invalid artwork IDs",
          },
        },
      },
    })
  })

  it("throws when not authenticated", async () => {
    await expect(
      runAuthenticatedQuery(mutation, {
        repositionPartnerListArtworksLoader: undefined,
        partnerListLoader: undefined,
      })
    ).rejects.toThrow("You need to be signed in to perform this action")
  })
})
