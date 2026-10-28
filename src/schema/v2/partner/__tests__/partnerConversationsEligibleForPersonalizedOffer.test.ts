import { runAuthenticatedQuery, runQuery } from "schema/v2/test/utils"
import gql from "lib/gql"

describe("Partner conversationsEligibleForPersonalizedOffer", () => {
  const query = gql`
    {
      partner(id: "example-partner") {
        conversationsEligibleForPersonalizedOffer {
          internalID
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

  it("returns every recent eligible inquiry, newest first", async () => {
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
        from_type: "User",
        conversation_type: "inquiry",
        sort: "-created_at",
        dismissed: false,
        created_within_days: 5,
      })
    )
    expect(partner.conversationsEligibleForPersonalizedOffer).toEqual([
      { internalID: "middle" },
      { internalID: "oldest" },
    ])
  })

  it("lets Impulse apply a custom window", async () => {
    const conversationsLoader = jest.fn().mockResolvedValue({
      conversations: [],
    })
    const partnerOfferEligibilityLoader = jest.fn()
    const windowQuery = gql`
      {
        partner(id: "example-partner") {
          conversationsEligibleForPersonalizedOffer(createdWithinDays: 14) {
            internalID
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

  it("checks every candidate Impulse returns", async () => {
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
    expect(partner.conversationsEligibleForPersonalizedOffer).toEqual([])
  })

  it("is empty when no recent inquiry is eligible", async () => {
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

    expect(partner.conversationsEligibleForPersonalizedOffer).toEqual([])
  })

  it("keeps looking when one eligibility check fails", async () => {
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

    expect(partner.conversationsEligibleForPersonalizedOffer).toEqual([
      { internalID: "fine" },
    ])
  })

  it("is empty when Impulse errors", async () => {
    const conversationsLoader = jest
      .fn()
      .mockRejectedValue(new Error("Impulse unavailable"))
    const partnerOfferEligibilityLoader = jest.fn()

    const { partner } = await runWith({
      conversationsLoader,
      partnerOfferEligibilityLoader,
    })

    expect(partnerOfferEligibilityLoader).not.toHaveBeenCalled()
    expect(partner.conversationsEligibleForPersonalizedOffer).toEqual([])
  })

  it("is empty when unauthenticated (no loaders available)", async () => {
    const { partner } = await runQuery(query, { partnerLoader })

    expect(partner.conversationsEligibleForPersonalizedOffer).toEqual([])
  })

  it("throws if selected under partnersConnection instead of a single partner", async () => {
    const connectionQuery = gql`
      {
        partnersConnection(first: 1) {
          edges {
            node {
              conversationsEligibleForPersonalizedOffer {
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
