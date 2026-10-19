import { runQuery } from "schema/v2/test/utils"
import gql from "lib/gql"

describe("conversation partnerOfferEligibility", () => {
  let partnerOfferEligibilityLoader
  let context

  const query = gql`
    {
      conversation(id: "conversation-1") {
        partnerOfferEligibility {
          status
          details {
            reason
            partnerOfferID
          }
        }
      }
    }
  `

  beforeEach(() => {
    partnerOfferEligibilityLoader = jest.fn(() =>
      Promise.resolve({ status: "eligible", details: {} })
    )

    context = {
      conversationLoader: () => Promise.resolve({ id: "conversation-1" }),
      partnerOfferEligibilityLoader,
    }
  })

  it("asks Gravity about the conversation by its id", async () => {
    await runQuery(query, context)

    expect(partnerOfferEligibilityLoader).toHaveBeenCalledWith({
      impulse_conversation_id: "conversation-1",
    })
  })

  it("returns eligible with empty details", async () => {
    const data = await runQuery(query, context)

    expect(data.conversation.partnerOfferEligibility).toEqual({
      status: "ELIGIBLE",
      details: { reason: null, partnerOfferID: null },
    })
  })

  it("returns the offer id when already offered", async () => {
    partnerOfferEligibilityLoader.mockResolvedValue({
      status: "already_offered",
      details: { partner_offer_id: "offer-1" },
    })

    const data = await runQuery(query, context)

    expect(data.conversation.partnerOfferEligibility).toEqual({
      status: "ALREADY_OFFERED",
      details: { reason: null, partnerOfferID: "offer-1" },
    })
  })

  it.each([
    ["collector_not_found", "COLLECTOR_NOT_FOUND"],
    ["artwork_not_offerable", "ARTWORK_NOT_OFFERABLE"],
    ["offer_window_closed", "OFFER_WINDOW_CLOSED"],
    ["active_bulk_offer", "ACTIVE_BULK_OFFER"],
    ["partner_visible_order", "PARTNER_VISIBLE_ORDER"],
    ["expired_personalized_offer", "EXPIRED_PERSONALIZED_OFFER"],
    ["unavailable", "UNAVAILABLE"],
  ])("maps the Gravity reason %s to %s", async (gravityReason, reason) => {
    partnerOfferEligibilityLoader.mockResolvedValue({
      status: "ineligible",
      details: { reason: gravityReason },
    })

    const data = await runQuery(query, context)

    expect(data.conversation.partnerOfferEligibility).toEqual({
      status: "INELIGIBLE",
      details: { reason: reason, partnerOfferID: null },
    })
  })

  it("returns null when Gravity fails, so callers treat it as not eligible", async () => {
    const consoleError = jest
      .spyOn(console, "error")
      .mockImplementation(() => undefined)
    partnerOfferEligibilityLoader.mockRejectedValue(new Error("403"))

    const data = await runQuery(query, context)

    expect(data.conversation.partnerOfferEligibility).toBeNull()
    expect(consoleError).toHaveBeenCalled()
    consoleError.mockRestore()
  })

  it("returns null when the user isn't signed in", async () => {
    const data = await runQuery(query, {
      ...context,
      partnerOfferEligibilityLoader: undefined,
    })

    expect(data.conversation.partnerOfferEligibility).toBeNull()
  })
})
