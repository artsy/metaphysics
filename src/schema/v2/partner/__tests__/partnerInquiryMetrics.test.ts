import { runAuthenticatedQuery, runQuery } from "schema/v2/test/utils"
import gql from "lib/gql"

describe("Partner inquiry metrics", () => {
  const query = gql`
    {
      partner(id: "example-partner") {
        inquiryMetrics {
          confirmedBuyersWaitingCount
          unansweredCount
        }
      }
    }
  `

  const partnerLoader = jest.fn().mockReturnValue(
    Promise.resolve({
      id: "example-partner",
      _id: "partner-internal-id",
    })
  )

  it("composes unanswered conversations with confirmed-buyer collector profiles", async () => {
    const conversationsLoader = jest.fn().mockResolvedValue({
      total_count: 7,
      conversations: [
        { from_id: "user-1" },
        { from_id: "user-2" },
        { from_id: "user-2" }, // repeat inquirer deduplicated
        { from_id: null }, // anonymous inquirer excluded
      ],
    })

    const partnerCollectorProfilesLoader = jest.fn().mockResolvedValue({
      body: [
        { collector_profile: { confirmed_buyer_at: "2024-01-01T00:00:00Z" } },
        { collector_profile: { confirmed_buyer_at: null } },
      ],
      headers: {},
    })

    const { partner } = await runAuthenticatedQuery(query, {
      partnerLoader,
      conversationsLoader,
      partnerCollectorProfilesLoader,
      userID: "user-id",
      accessToken: "access-token",
    })

    expect(conversationsLoader).toHaveBeenCalledWith(
      expect.objectContaining({
        sort: "-last_message_at",
        to_id: "partner-internal-id",
        to_type: "Partner",
        has_message: true,
        has_reply: false,
        dismissed: false,
        to_be_replied: true,
      })
    )
    expect(partnerCollectorProfilesLoader).toHaveBeenCalledWith({
      partner_id: "partner-internal-id",
      user_ids: ["user-1", "user-2"],
      size: 2,
    })
    expect(conversationsLoader).toHaveBeenCalledTimes(1)
    expect(partner.inquiryMetrics).toEqual({
      confirmedBuyersWaitingCount: 1,
      unansweredCount: 7,
    })
  })

  it("skips the collector profile lookup when there are no unanswered conversations", async () => {
    const conversationsLoader = jest.fn().mockResolvedValue({
      total_count: 0,
      conversations: [],
    })
    const partnerCollectorProfilesLoader = jest.fn()

    const { partner } = await runAuthenticatedQuery(query, {
      partnerLoader,
      conversationsLoader,
      partnerCollectorProfilesLoader,
      userID: "user-id",
      accessToken: "access-token",
    })

    expect(partnerCollectorProfilesLoader).not.toHaveBeenCalled()
    expect(partner.inquiryMetrics).toEqual({
      confirmedBuyersWaitingCount: 0,
      unansweredCount: 0,
    })
  })

  it("returns null counts when the conversations loader errors", async () => {
    const conversationsLoader = jest
      .fn()
      .mockRejectedValue(new Error("Impulse unavailable"))
    const partnerCollectorProfilesLoader = jest.fn()

    const { partner } = await runAuthenticatedQuery(query, {
      partnerLoader,
      conversationsLoader,
      partnerCollectorProfilesLoader,
      userID: "user-id",
      accessToken: "access-token",
    })

    expect(partnerCollectorProfilesLoader).not.toHaveBeenCalled()
    expect(partner.inquiryMetrics).toEqual({
      confirmedBuyersWaitingCount: null,
      unansweredCount: null,
    })
  })

  it("still returns the unanswered count when the collector profile lookup fails", async () => {
    const conversationsLoader = jest.fn().mockResolvedValue({
      total_count: 4,
      conversations: [{ from_id: "user-1" }],
    })
    const partnerCollectorProfilesLoader = jest
      .fn()
      .mockRejectedValue(new Error("Gravity unavailable"))

    const { partner } = await runAuthenticatedQuery(query, {
      partnerLoader,
      conversationsLoader,
      partnerCollectorProfilesLoader,
      userID: "user-id",
      accessToken: "access-token",
    })

    expect(partner.inquiryMetrics).toEqual({
      confirmedBuyersWaitingCount: null,
      unansweredCount: 4,
    })
  })

  it("doesn't look up collector profiles when only the unanswered count is selected", async () => {
    const countOnlyQuery = gql`
      {
        partner(id: "example-partner") {
          inquiryMetrics {
            unansweredCount
          }
        }
      }
    `
    const conversationsLoader = jest.fn().mockResolvedValue({
      total_count: 3,
      conversations: [{ from_id: "user-1" }],
    })
    const partnerCollectorProfilesLoader = jest.fn()

    const { partner } = await runAuthenticatedQuery(countOnlyQuery, {
      partnerLoader,
      conversationsLoader,
      partnerCollectorProfilesLoader,
      userID: "user-id",
      accessToken: "access-token",
    })

    expect(partner.inquiryMetrics).toEqual({ unansweredCount: 3 })
    expect(partnerCollectorProfilesLoader).not.toHaveBeenCalled()
  })

  it("returns null when unauthenticated (no loaders available)", async () => {
    const { partner } = await runQuery(query, { partnerLoader })

    expect(partner.inquiryMetrics).toBeNull()
  })

  it("throws if inquiryMetrics is selected under partnersConnection instead of a single partner", async () => {
    const connectionQuery = gql`
      {
        partnersConnection(first: 2) {
          edges {
            node {
              inquiryMetrics {
                unansweredCount
              }
            }
          }
        }
      }
    `

    const partnersLoader = jest.fn().mockResolvedValue({
      body: [
        { id: "partner-1", _id: "partner-1-internal-id" },
        { id: "partner-2", _id: "partner-2-internal-id" },
      ],
      headers: { "x-total-count": "2" },
    })
    const conversationsLoader = jest.fn()
    const partnerCollectorProfilesLoader = jest.fn()

    // With several partners GraphQL aggregates the errors, so match on the stack.
    let thrown: Error | undefined
    try {
      await runAuthenticatedQuery(connectionQuery, {
        partnersLoader,
        conversationsLoader,
        partnerCollectorProfilesLoader,
        userID: "user-id",
        accessToken: "access-token",
      })
    } catch (error) {
      thrown = error as Error
    }

    expect(thrown?.stack).toMatch(
      /cannot be queried under a list or connection/
    )

    expect(conversationsLoader).not.toHaveBeenCalled()
    expect(partnerCollectorProfilesLoader).not.toHaveBeenCalled()
  })
})
