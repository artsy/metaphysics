import gql from "lib/gql"
import { runAuthenticatedQuery } from "schema/v2/test/utils"

describe("UpdatePartnerListMutation", () => {
  const mutation = gql`
    mutation {
      updatePartnerList(
        input: { id: "list-abc", name: "Updated Name", listType: FAIR }
      ) {
        partnerListOrError {
          __typename
          ... on UpdatePartnerListSuccess {
            partnerList {
              internalID
              name
              listType
            }
          }
          ... on UpdatePartnerListFailure {
            mutationError {
              message
            }
          }
        }
      }
    }
  `

  it("updates a partner list", async () => {
    const context = {
      updatePartnerListLoader: jest.fn().mockResolvedValue({
        id: "list-abc",
        name: "Updated Name",
        list_type: "fair",
        artworks_count: 5,
        created_at: "2026-01-01T00:00:00+00:00",
        updated_at: "2026-01-02T00:00:00+00:00",
      }),
    }

    const result = await runAuthenticatedQuery(mutation, context)

    expect(context.updatePartnerListLoader).toHaveBeenCalledWith("list-abc", {
      name: "Updated Name",
      list_type: "fair",
    })

    expect(result).toEqual({
      updatePartnerList: {
        partnerListOrError: {
          __typename: "UpdatePartnerListSuccess",
          partnerList: {
            internalID: "list-abc",
            name: "Updated Name",
            listType: "FAIR",
          },
        },
      },
    })
  })

  it("returns a mutation error on failure", async () => {
    const context = {
      updatePartnerListLoader: jest.fn().mockRejectedValue({
        body: { message: "List not found" },
      }),
    }

    const result = await runAuthenticatedQuery(mutation, context)

    expect(result).toEqual({
      updatePartnerList: {
        partnerListOrError: {
          __typename: "UpdatePartnerListFailure",
          mutationError: {
            message: "List not found",
          },
        },
      },
    })
  })

  it("throws when not authenticated", async () => {
    await expect(
      runAuthenticatedQuery(mutation, {
        updatePartnerListLoader: undefined,
      })
    ).rejects.toThrow("You need to be signed in to perform this action")
  })
})
