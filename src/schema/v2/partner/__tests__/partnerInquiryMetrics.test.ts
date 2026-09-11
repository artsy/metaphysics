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

  it("returns null when a loader errors", async () => {
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

    expect(partner.inquiryMetrics).toBeNull()
  })

  it("returns null when unauthenticated (no loaders available)", async () => {
    const { partner } = await runQuery(query, { partnerLoader })

    expect(partner.inquiryMetrics).toBeNull()
  })
})
