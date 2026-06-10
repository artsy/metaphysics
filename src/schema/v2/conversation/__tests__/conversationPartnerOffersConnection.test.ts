import { runQuery } from "schema/v2/test/utils"
import gql from "lib/gql"

describe("conversation partnerOffersConnection", () => {
  let partnerOffersLoader
  let context

  beforeEach(() => {
    partnerOffersLoader = jest.fn(() =>
      Promise.resolve({
        body: [
          {
            id: "offer-1",
            active: true,
            artwork_id: "artwork-1",
            available: true,
            partner_id: "partner-id",
            price_currency: "USD",
            discount_percentage: 10,
            source: "Conversation",
            created_at: "2024-02-27T19:01:51.461Z",
            end_at: "2024-03-01T19:01:51.457Z",
          },
        ],
        headers: { "x-total-count": "1" },
      })
    )

    context = {
      conversationLoader: () =>
        Promise.resolve({
          id: "conversation-1",
          from_id: "buyer-1",
          from_type: "User",
          to_id: "partner-id",
          to_type: "Partner",
          items: [
            {
              item_type: "Artwork",
              item_id: "artwork-1",
              properties: {
                id: "artwork-1",
                _id: "artwork-1",
              },
            },
          ],
        }),
      partnerOffersLoader,
    }
  })

  it("scopes offers to the conversation's artwork and from_id, and passes offerType", async () => {
    const query = gql`
      {
        conversation(id: "conversation-1") {
          partnerOffersConnection(first: 10, offerType: [PERSONALIZED]) {
            totalCount
            edges {
              node {
                internalID
                artworkId
                source
              }
            }
          }
        }
      }
    `

    const data = await runQuery(query, context)

    expect(partnerOffersLoader).toHaveBeenCalledWith(
      expect.objectContaining({
        artwork_id: "artwork-1",
        user_id: "buyer-1",
        offer_type: ["personalized"],
      })
    )

    expect(data).toEqual({
      conversation: {
        partnerOffersConnection: {
          totalCount: 1,
          edges: [
            {
              node: {
                internalID: "offer-1",
                artworkId: "artwork-1",
                source: "CONVERSATION",
              },
            },
          ],
        },
      },
    })
  })

  it("omits offer_type when the arg is not given", async () => {
    const query = gql`
      {
        conversation(id: "conversation-1") {
          partnerOffersConnection(first: 10) {
            edges {
              node {
                internalID
              }
            }
          }
        }
      }
    `

    await runQuery(query, context)

    expect(partnerOffersLoader).toHaveBeenCalledWith(
      expect.objectContaining({
        artwork_id: "artwork-1",
        user_id: "buyer-1",
        offer_type: undefined,
      })
    )
  })

  it("returns null when the conversation has no artwork item", async () => {
    const contextWithNoArtwork = {
      conversationLoader: () =>
        Promise.resolve({
          id: "conversation-1",
          from_id: "buyer-1",
          items: [],
        }),
      partnerOffersLoader,
    }

    const query = gql`
      {
        conversation(id: "conversation-1") {
          partnerOffersConnection(first: 10) {
            totalCount
          }
        }
      }
    `

    const data = await runQuery(query, contextWithNoArtwork)

    expect(data).toEqual({
      conversation: {
        partnerOffersConnection: null,
      },
    })
    expect(partnerOffersLoader).not.toHaveBeenCalled()
  })

  it("throws when partnerOffersLoader is unavailable (signed out)", async () => {
    const contextWithoutLoader = {
      conversationLoader: () =>
        Promise.resolve({
          id: "conversation-1",
          from_id: "buyer-1",
          items: [
            {
              item_type: "Artwork",
              item_id: "artwork-1",
              properties: { id: "artwork-1", _id: "artwork-1" },
            },
          ],
        }),
    }

    const query = gql`
      {
        conversation(id: "conversation-1") {
          partnerOffersConnection(first: 10) {
            totalCount
          }
        }
      }
    `

    await expect(runQuery(query, contextWithoutLoader)).rejects.toThrow(
      "You need to be signed in to perform this action"
    )
  })
})
