import gql from "lib/gql"
import { runAuthenticatedQuery } from "schema/v2/test/utils"

describe("CreatePartnerListMutation", () => {
  const mutation = gql`
    mutation {
      createPartnerList(
        input: {
          partnerID: "partner-123"
          name: "Spring 2026 Show"
          listType: SHOW
          startAt: "2026-03-01"
          endAt: "2026-06-01"
        }
      ) {
        partnerListOrError {
          __typename
          ... on CreatePartnerListSuccess {
            partnerList {
              internalID
              name
              listType
              artworksCount
            }
          }
          ... on CreatePartnerListFailure {
            mutationError {
              message
            }
          }
        }
      }
    }
  `

  it("creates a partner list", async () => {
    const context = {
      createPartnerListLoader: jest.fn().mockResolvedValue({
        id: "list-abc",
        name: "Spring 2026 Show",
        list_type: "show",
        artworks_count: 0,
        start_at: "2026-03-01T00:00:00+00:00",
        end_at: "2026-06-01T00:00:00+00:00",
        created_at: "2026-01-01T00:00:00+00:00",
        updated_at: "2026-01-01T00:00:00+00:00",
      }),
    }

    const result = await runAuthenticatedQuery(mutation, context)

    expect(context.createPartnerListLoader).toHaveBeenCalledWith({
      partner_id: "partner-123",
      name: "Spring 2026 Show",
      list_type: "show",
      start_at: "2026-03-01",
      end_at: "2026-06-01",
    })

    expect(result).toEqual({
      createPartnerList: {
        partnerListOrError: {
          __typename: "CreatePartnerListSuccess",
          partnerList: {
            internalID: "list-abc",
            name: "Spring 2026 Show",
            listType: "SHOW",
            artworksCount: 0,
          },
        },
      },
    })
  })

  it("passes fairID to gravity when provided", async () => {
    const fairMutation = gql`
      mutation {
        createPartnerList(
          input: {
            partnerID: "partner-123"
            name: "Art Basel 2026"
            listType: FAIR
            fairID: "fair-abc"
          }
        ) {
          partnerListOrError {
            __typename
          }
        }
      }
    `

    const context = {
      createPartnerListLoader: jest.fn().mockResolvedValue({
        id: "list-xyz",
        name: "Art Basel 2026",
        list_type: "fair",
        artworks_count: 0,
        fair_id: "fair-abc",
      }),
    }

    await runAuthenticatedQuery(fairMutation, context)

    expect(context.createPartnerListLoader).toHaveBeenCalledWith({
      partner_id: "partner-123",
      name: "Art Basel 2026",
      list_type: "fair",
      fair_id: "fair-abc",
    })
  })

  it("returns a mutation error on failure", async () => {
    const context = {
      createPartnerListLoader: jest.fn().mockRejectedValue({
        body: { message: "Partner not found" },
      }),
    }

    const result = await runAuthenticatedQuery(mutation, context)

    expect(result).toEqual({
      createPartnerList: {
        partnerListOrError: {
          __typename: "CreatePartnerListFailure",
          mutationError: {
            message: "Partner not found",
          },
        },
      },
    })
  })

  it("throws when not authenticated", async () => {
    await expect(
      runAuthenticatedQuery(mutation, {
        createPartnerListLoader: undefined,
      })
    ).rejects.toThrow("You need to be signed in to perform this action")
  })
})
