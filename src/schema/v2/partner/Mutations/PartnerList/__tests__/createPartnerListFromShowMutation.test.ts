import gql from "lib/gql"
import { runAuthenticatedQuery } from "schema/v2/test/utils"

describe("CreatePartnerListFromShowMutation", () => {
  const mutation = gql`
    mutation {
      createPartnerListFromShow(
        input: { partnerID: "partner-123", showID: "show-456" }
      ) {
        partnerListOrError {
          __typename
          ... on CreatePartnerListFromShowSuccess {
            partnerList {
              internalID
              name
              listType
              artworksCount
              partnerShowID
            }
            show {
              internalID
            }
          }
          ... on CreatePartnerListFromShowFailure {
            mutationError {
              message
              statusCode
            }
          }
        }
      }
    }
  `

  const partnerListData = {
    id: "list-abc",
    partner_id: "partner-123",
    name: "Summer Show",
    list_type: "show",
    artworks_count: 3,
    partner_show_id: "show-456",
    distributed_at: "2026-09-24T00:00:00+00:00",
  }

  it("creates a partner list from the show", async () => {
    const context = {
      createPartnerListFromShowLoader: jest
        .fn()
        .mockResolvedValue(partnerListData),
      partnerShowLoader: jest.fn().mockResolvedValue({ _id: "show-456" }),
    }

    const result = await runAuthenticatedQuery(mutation, context)

    expect(context.createPartnerListFromShowLoader).toHaveBeenCalledWith({
      partner_id: "partner-123",
      partner_show_id: "show-456",
    })
    expect(context.partnerShowLoader).toHaveBeenCalledWith({
      partner_id: "partner-123",
      show_id: "show-456",
    })

    expect(result).toEqual({
      createPartnerListFromShow: {
        partnerListOrError: {
          __typename: "CreatePartnerListFromShowSuccess",
          partnerList: {
            internalID: "list-abc",
            name: "Summer Show",
            listType: "SHOW",
            artworksCount: 3,
            partnerShowID: "show-456",
          },
          show: {
            internalID: "show-456",
          },
        },
      },
    })
  })

  it("returns a mutation error when the show was already added", async () => {
    const context = {
      createPartnerListFromShowLoader: jest.fn().mockRejectedValue({
        statusCode: 409,
        body: { message: "Show has already been added to inventory" },
      }),
    }

    const result = await runAuthenticatedQuery(mutation, context)

    expect(result).toEqual({
      createPartnerListFromShow: {
        partnerListOrError: {
          __typename: "CreatePartnerListFromShowFailure",
          mutationError: {
            message: "Show has already been added to inventory",
            statusCode: 409,
          },
        },
      },
    })
  })

  it.each([
    [400, "Show has no artworks"],
    [404, "Partner Show Not Found"],
  ])(
    "returns a mutation error when Gravity responds with %i",
    async (statusCode, message) => {
      const context = {
        createPartnerListFromShowLoader: jest.fn().mockRejectedValue({
          statusCode,
          body: { message },
        }),
      }

      const result = await runAuthenticatedQuery(mutation, context)

      expect(result).toEqual({
        createPartnerListFromShow: {
          partnerListOrError: {
            __typename: "CreatePartnerListFromShowFailure",
            mutationError: { message, statusCode },
          },
        },
      })
    }
  )

  it("returns a null show when the list isn't linked to a show", async () => {
    const context = {
      createPartnerListFromShowLoader: jest
        .fn()
        .mockResolvedValue({ ...partnerListData, partner_show_id: null }),
      partnerShowLoader: jest.fn(),
    }

    const result = await runAuthenticatedQuery(mutation, context)

    expect(context.partnerShowLoader).not.toHaveBeenCalled()
    expect(result.createPartnerListFromShow.partnerListOrError.show).toBeNull()
  })

  it("throws when not authenticated", async () => {
    await expect(
      runAuthenticatedQuery(mutation, {
        createPartnerListFromShowLoader: undefined,
      })
    ).rejects.toThrow("You need to be signed in to perform this action")
  })
})
