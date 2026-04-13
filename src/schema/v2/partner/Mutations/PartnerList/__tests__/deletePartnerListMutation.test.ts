import gql from "lib/gql"
import { runAuthenticatedQuery } from "schema/v2/test/utils"

describe("DeletePartnerListMutation", () => {
  const mutation = gql`
    mutation {
      deletePartnerList(input: { id: "list-abc" }) {
        partnerListOrError {
          __typename
          ... on DeletePartnerListSuccess {
            partnerList {
              internalID
              name
            }
          }
          ... on DeletePartnerListFailure {
            mutationError {
              message
            }
          }
        }
      }
    }
  `

  it("deletes a partner list", async () => {
    const context = {
      deletePartnerListLoader: jest.fn().mockResolvedValue({
        id: "list-abc",
        name: "Spring 2026 Show",
        list_type: "show",
        artworks_count: 0,
        created_at: "2026-01-01T00:00:00+00:00",
        updated_at: "2026-01-01T00:00:00+00:00",
      }),
    }

    const result = await runAuthenticatedQuery(mutation, context)

    expect(context.deletePartnerListLoader).toHaveBeenCalledWith("list-abc")

    expect(result).toEqual({
      deletePartnerList: {
        partnerListOrError: {
          __typename: "DeletePartnerListSuccess",
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
      deletePartnerListLoader: jest.fn().mockRejectedValue({
        body: { message: "List not found" },
      }),
    }

    const result = await runAuthenticatedQuery(mutation, context)

    expect(result).toEqual({
      deletePartnerList: {
        partnerListOrError: {
          __typename: "DeletePartnerListFailure",
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
        deletePartnerListLoader: undefined,
      })
    ).rejects.toThrow("You need to be signed in to perform this action")
  })
})
