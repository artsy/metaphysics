import { runAuthenticatedQuery, runQuery } from "schema/v2/test/utils"
import gql from "lib/gql"

describe("Partner inquiryMetrics.conversationEligibleForPersonalizedOffer", () => {
  const query = gql`
    {
      partner(id: "example-partner") {
        inquiryMetrics {
          conversationEligibleForPersonalizedOffer {
            internalID
          }
        }
      }
    }
  `

  const partnerLoader = jest.fn().mockResolvedValue({
    id: "example-partner",
    _id: "partner-internal-id",
  })

  const runWith = (loaders: Record<string, jest.Mock>) => {
    return runAuthenticatedQuery(query, {
      partnerLoader,
      userID: "user-id",
      accessToken: "access-token",
      ...loaders,
    })
  }

  it("returns the newest eligible inquiry and stops checking there", async () => {
    const conversationsLoader = jest.fn().mockResolvedValue({
      conversations: [{ id: "newest" }, { id: "middle" }, { id: "oldest" }],
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
        created_within_days: 5,
      })
    )
    expect(
      partner.inquiryMetrics.conversationEligibleForPersonalizedOffer
    ).toEqual({ internalID: "middle" })
    expect(partnerOfferEligibilityLoader).toHaveBeenCalledTimes(2)
    expect(partnerOfferEligibilityLoader).not.toHaveBeenCalledWith({
      impulse_conversation_id: "oldest",
    })
  })

  it("lets Impulse apply a custom window", async () => {
    const conversationsLoader = jest.fn().mockResolvedValue({
      conversations: [],
    })
    const partnerOfferEligibilityLoader = jest.fn()
    const windowQuery = gql`
      {
        partner(id: "example-partner") {
          inquiryMetrics {
            conversationEligibleForPersonalizedOffer(createdWithinDays: 14) {
              internalID
            }
          }
        }
      }
    `

    await runAuthenticatedQuery(windowQuery, {
      partnerLoader,
      conversationsLoader,
      partnerOfferEligibilityLoader,
      userID: "user-id",
      accessToken: "access-token",
    })

    expect(conversationsLoader).toHaveBeenCalledWith(
      expect.objectContaining({ created_within_days: 14 })
    )
    expect(partnerOfferEligibilityLoader).not.toHaveBeenCalled()
  })

  it("rejects an explicit null window instead of forwarding it to Impulse", async () => {
    const conversationsLoader = jest.fn()
    const nullWindowQuery = gql`
      {
        partner(id: "example-partner") {
          inquiryMetrics {
            conversationEligibleForPersonalizedOffer(createdWithinDays: null) {
              internalID
            }
          }
        }
      }
    `

    await expect(
      runAuthenticatedQuery(nullWindowQuery, {
        partnerLoader,
        conversationsLoader,
        partnerOfferEligibilityLoader: jest.fn(),
        userID: "user-id",
        accessToken: "access-token",
      })
    ).rejects.toThrow(/Int!/)

    expect(conversationsLoader).not.toHaveBeenCalled()
  })

  it.each([0, -1])(
    "is null without calling Impulse when the window is %d days",
    async (days) => {
      const conversationsLoader = jest.fn()
      const partnerOfferEligibilityLoader = jest.fn()
      const windowQuery = gql`
        {
          partner(id: "example-partner") {
            inquiryMetrics {
              conversationEligibleForPersonalizedOffer(createdWithinDays: ${days}) {
                internalID
              }
            }
          }
        }
      `

      const { partner } = await runAuthenticatedQuery(windowQuery, {
        partnerLoader,
        conversationsLoader,
        partnerOfferEligibilityLoader,
        userID: "user-id",
        accessToken: "access-token",
      })

      expect(
        partner.inquiryMetrics.conversationEligibleForPersonalizedOffer
      ).toBeNull()
      expect(conversationsLoader).not.toHaveBeenCalled()
      expect(partnerOfferEligibilityLoader).not.toHaveBeenCalled()
    }
  )

  it("checks every candidate when none is eligible", async () => {
    const conversationsLoader = jest.fn().mockResolvedValue({
      conversations: [{ id: "first" }, { id: "second" }],
    })
    const partnerOfferEligibilityLoader = jest
      .fn()
      .mockResolvedValue({ status: "ineligible" })

    const { partner } = await runWith({
      conversationsLoader,
      partnerOfferEligibilityLoader,
    })

    expect(partnerOfferEligibilityLoader).toHaveBeenCalledTimes(2)
    expect(partnerOfferEligibilityLoader).toHaveBeenCalledWith({
      impulse_conversation_id: "first",
    })
    expect(partnerOfferEligibilityLoader).toHaveBeenCalledWith({
      impulse_conversation_id: "second",
    })
    expect(
      partner.inquiryMetrics.conversationEligibleForPersonalizedOffer
    ).toBeNull()
  })

  it("is null when no recent inquiry is eligible", async () => {
    const conversationsLoader = jest.fn().mockResolvedValue({
      conversations: [{ id: "a" }],
    })
    const partnerOfferEligibilityLoader = jest
      .fn()
      .mockResolvedValue({ status: "already_offered" })

    const { partner } = await runWith({
      conversationsLoader,
      partnerOfferEligibilityLoader,
    })

    expect(
      partner.inquiryMetrics.conversationEligibleForPersonalizedOffer
    ).toBeNull()
  })

  it("stops scanning at the first failed eligibility check", async () => {
    const conversationsLoader = jest.fn().mockResolvedValue({
      conversations: [{ id: "broken" }, { id: "fine" }],
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

    expect(partnerOfferEligibilityLoader).toHaveBeenCalledTimes(1)
    expect(
      partner.inquiryMetrics.conversationEligibleForPersonalizedOffer
    ).toBeNull()
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
    expect(
      partner.inquiryMetrics.conversationEligibleForPersonalizedOffer
    ).toBeNull()
  })

  it("is unavailable when unauthenticated (no loaders available)", async () => {
    const { partner } = await runQuery(query, { partnerLoader })

    expect(partner.inquiryMetrics).toBeNull()
  })

  it("is null when the eligibility loader is unavailable", async () => {
    const { partner } = await runWith({
      conversationsLoader: jest.fn().mockResolvedValue({
        conversations: [{ id: "a" }],
      }),
      partnerOfferEligibilityLoader: undefined as any,
    })

    expect(
      partner.inquiryMetrics.conversationEligibleForPersonalizedOffer
    ).toBeNull()
  })

  it("doesn't pay for the collector profile lookup the other metrics need", async () => {
    const partnerCollectorProfilesLoader = jest.fn()

    await runWith({
      conversationsLoader: jest.fn().mockResolvedValue({ conversations: [] }),
      partnerOfferEligibilityLoader: jest.fn(),
      partnerCollectorProfilesLoader,
    })

    expect(partnerCollectorProfilesLoader).not.toHaveBeenCalled()
  })

  it("throws if selected under partnersConnection instead of a single partner, without calling upstream", async () => {
    const connectionQuery = gql`
      {
        partnersConnection(first: 2) {
          edges {
            node {
              inquiryMetrics {
                conversationEligibleForPersonalizedOffer {
                  internalID
                }
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
    const partnerOfferEligibilityLoader = jest.fn()

    // With several partners GraphQL aggregates the errors, so match on the stack.
    let thrown: Error | undefined
    try {
      await runAuthenticatedQuery(connectionQuery, {
        partnersLoader,
        conversationsLoader,
        partnerOfferEligibilityLoader,
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
    expect(partnerOfferEligibilityLoader).not.toHaveBeenCalled()
  })
})
