import { runAuthenticatedQuery, runQuery } from "schema/v2/test/utils"
import gql from "lib/gql"

describe("Partner offerEligibleConversation", () => {
  const query = gql`
    {
      partner(id: "example-partner") {
        offerEligibleConversation {
          internalID
        }
      }
    }
  `

  const partnerLoader = jest.fn().mockResolvedValue({
    id: "example-partner",
    _id: "partner-internal-id",
  })

  const daysAgo = (days: number) => {
    return new Date(Date.now() - days * 24 * 60 * 60 * 1000).toISOString()
  }

  const runWith = (loaders: Record<string, jest.Mock>) => {
    return runAuthenticatedQuery(query, {
      partnerLoader,
      userID: "user-id",
      accessToken: "access-token",
      ...loaders,
    })
  }

  it("returns the newest recent inquiry that is eligible", async () => {
    const conversationsLoader = jest.fn().mockResolvedValue({
      conversations: [
        { id: "newest", created_at: daysAgo(1) },
        { id: "middle", created_at: daysAgo(2) },
        { id: "oldest", created_at: daysAgo(3) },
      ],
    })
    const partnerOfferEligibilityLoader = jest
      .fn()
      .mockImplementation(({ impulse_conversation_id }) => {
        return Promise.resolve({
          status:
            impulse_conversation_id === "newest"
              ? "already_offered"
              : "eligible",
        })
      })

    const { partner } = await runWith({
      conversationsLoader,
      partnerOfferEligibilityLoader,
    })

    expect(conversationsLoader).toHaveBeenCalledWith(
      expect.objectContaining({
        to_id: "partner-internal-id",
        to_type: "Partner",
        conversation_type: "inquiry",
        sort: "-created_at",
        dismissed: false,
      })
    )
    expect(partner.offerEligibleConversation).toEqual({ internalID: "middle" })
  })

  it("ignores inquiries older than the window without checking them", async () => {
    const conversationsLoader = jest.fn().mockResolvedValue({
      conversations: [
        { id: "recent", created_at: daysAgo(4) },
        { id: "stale", created_at: daysAgo(6) },
      ],
    })
    const partnerOfferEligibilityLoader = jest
      .fn()
      .mockResolvedValue({ status: "ineligible" })

    const { partner } = await runWith({
      conversationsLoader,
      partnerOfferEligibilityLoader,
    })

    expect(partnerOfferEligibilityLoader).toHaveBeenCalledTimes(1)
    expect(partnerOfferEligibilityLoader).toHaveBeenCalledWith({
      impulse_conversation_id: "recent",
    })
    expect(partner.offerEligibleConversation).toBeNull()
  })

  it("is null when no recent inquiry is eligible", async () => {
    const conversationsLoader = jest.fn().mockResolvedValue({
      conversations: [{ id: "a", created_at: daysAgo(1) }],
    })
    const partnerOfferEligibilityLoader = jest
      .fn()
      .mockResolvedValue({ status: "already_offered" })

    const { partner } = await runWith({
      conversationsLoader,
      partnerOfferEligibilityLoader,
    })

    expect(partner.offerEligibleConversation).toBeNull()
  })

  it("keeps looking when one eligibility check fails", async () => {
    const conversationsLoader = jest.fn().mockResolvedValue({
      conversations: [
        { id: "broken", created_at: daysAgo(1) },
        { id: "fine", created_at: daysAgo(2) },
      ],
    })
    const partnerOfferEligibilityLoader = jest
      .fn()
      .mockImplementation(({ impulse_conversation_id }) => {
        return impulse_conversation_id === "broken"
          ? Promise.reject(new Error("Gravity unavailable"))
          : Promise.resolve({ status: "eligible" })
      })

    const { partner } = await runWith({
      conversationsLoader,
      partnerOfferEligibilityLoader,
    })

    expect(partner.offerEligibleConversation).toEqual({ internalID: "fine" })
  })

  it("is null when Impulse errors", async () => {
    const conversationsLoader = jest
      .fn()
      .mockRejectedValue(new Error("Impulse unavailable"))
    const partnerOfferEligibilityLoader = jest.fn()

    const { partner } = await runWith({
      conversationsLoader,
      partnerOfferEligibilityLoader,
    })

    expect(partnerOfferEligibilityLoader).not.toHaveBeenCalled()
    expect(partner.offerEligibleConversation).toBeNull()
  })

  it("is null when unauthenticated (no loaders available)", async () => {
    const { partner } = await runQuery(query, { partnerLoader })

    expect(partner.offerEligibleConversation).toBeNull()
  })

  it("throws if selected under partnersConnection instead of a single partner", async () => {
    const connectionQuery = gql`
      {
        partnersConnection(first: 1) {
          edges {
            node {
              offerEligibleConversation {
                internalID
              }
            }
          }
        }
      }
    `

    const partnersLoader = jest.fn().mockResolvedValue({
      body: [{ id: "partner-1", _id: "partner-1-internal-id" }],
      headers: { "x-total-count": "1" },
    })

    await expect(
      runAuthenticatedQuery(connectionQuery, {
        partnersLoader,
        conversationsLoader: jest.fn(),
        partnerOfferEligibilityLoader: jest.fn(),
        userID: "user-id",
        accessToken: "access-token",
      })
    ).rejects.toThrow(/cannot be queried under a list or connection/)
  })
})
