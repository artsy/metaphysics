import gql from "lib/gql"
import { runAuthenticatedQuery } from "schema/v2/test/utils"

describe("DistributePartnerListMutation", () => {
  const mutation = gql`
    mutation {
      distributePartnerList(input: { id: "list-abc" }) {
        partnerListOrError {
          __typename
          ... on DistributePartnerListSuccess {
            partnerList {
              internalID
              name
              distributedAt
              partnerShowID
            }
          }
          ... on DistributePartnerListFailure {
            mutationError {
              message
            }
          }
        }
      }
    }
  `

  it("distributes a partner list", async () => {
    const context = {
      distributePartnerListLoader: jest.fn().mockResolvedValue({
        id: "list-abc",
        name: "Spring 2026 Show",
        list_type: "show",
        artworks_count: 3,
        distributed_at: "2026-01-15T00:00:00+00:00",
        partner_show_id: "show-xyz",
        created_at: "2026-01-01T00:00:00+00:00",
        updated_at: "2026-01-15T00:00:00+00:00",
      }),
    }

    const result = await runAuthenticatedQuery(mutation, context)

    expect(context.distributePartnerListLoader).toHaveBeenCalledWith("list-abc")

    expect(result).toEqual({
      distributePartnerList: {
        partnerListOrError: {
          __typename: "DistributePartnerListSuccess",
          partnerList: {
            internalID: "list-abc",
            name: "Spring 2026 Show",
            distributedAt: "2026-01-15T00:00:00+00:00",
            partnerShowID: "show-xyz",
          },
        },
      },
    })
  })

  it("returns a mutation error on failure", async () => {
    const context = {
      distributePartnerListLoader: jest.fn().mockRejectedValue({
        body: { message: "List has no artworks" },
      }),
    }

    const result = await runAuthenticatedQuery(mutation, context)

    expect(result).toEqual({
      distributePartnerList: {
        partnerListOrError: {
          __typename: "DistributePartnerListFailure",
          mutationError: {
            message: "List has no artworks",
          },
        },
      },
    })
  })

  it("throws when not authenticated", async () => {
    await expect(
      runAuthenticatedQuery(mutation, {
        distributePartnerListLoader: undefined,
      })
    ).rejects.toThrow("You need to be signed in to perform this action")
  })
})
