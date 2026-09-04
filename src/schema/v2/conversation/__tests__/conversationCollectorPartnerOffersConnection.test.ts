import { runQuery } from "schema/v2/test/utils"
import gql from "lib/gql"

describe("conversation collectorPartnerOffersConnection", () => {
  let mePartnerOffersLoader
  let context

  beforeEach(() => {
    mePartnerOffersLoader = jest.fn(() =>
      Promise.resolve({
        body: [
          {
            id: "offer-1",
            active: true,
            artwork_id: "artwork-1",
            available: true,
            partner_id: "partner-id",
            price_currency: "USD",
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
      mePartnerOffersLoader,
    }
  })

  it("scopes the current user's offers to the conversation's artwork and passes offerType", async () => {
    const query = gql`
      {
        conversation(id: "conversation-1") {
          collectorPartnerOffersConnection(
            first: 10
            offerType: [PERSONALIZED]
          ) {
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

    expect(mePartnerOffersLoader).toHaveBeenCalledWith(
      expect.objectContaining({
        artwork_id: "artwork-1",
        offer_type: ["personalized"],
        total_count: true,
      })
    )

    expect(data).toEqual({
      conversation: {
        collectorPartnerOffersConnection: {
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
          collectorPartnerOffersConnection(first: 10) {
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

    expect(mePartnerOffersLoader).toHaveBeenCalledWith(
      expect.objectContaining({
        artwork_id: "artwork-1",
        offer_type: undefined,
      })
    )
  })

  it("stamps isPurchased for the whole page in a single Exchange request", async () => {
    const mePartnerOffersLoader = () =>
      Promise.resolve({
        body: [
          { id: "offer-1", artwork_id: "artwork-1" },
          { id: "offer-2", artwork_id: "artwork-1" },
        ],
        headers: { "x-total-count": "2" },
      })

    const meOrdersLoader = jest.fn(() =>
      Promise.resolve({
        body: [
          {
            buyer_state: "APPROVED",
            line_items: [{ partner_offer_id: "offer-2" }],
          },
        ],
        headers: {},
      })
    )

    const query = gql`
      {
        conversation(id: "conversation-1") {
          collectorPartnerOffersConnection(first: 10) {
            edges {
              node {
                internalID
                isPurchased
              }
            }
          }
        }
      }
    `

    const data = await runQuery(query, {
      ...context,
      mePartnerOffersLoader,
      meOrdersLoader,
    })

    // One batched Exchange call for the whole page — not one per offer node.
    expect(meOrdersLoader).toHaveBeenCalledTimes(1)
    expect(meOrdersLoader).toHaveBeenCalledWith({
      partner_offer_ids: "offer-1,offer-2",
      buyer_state: "SUBMITTED,APPROVED,COMPLETED",
      size: 2,
    })

    expect(
      data.conversation.collectorPartnerOffersConnection.edges.map(
        (edge) => edge.node
      )
    ).toEqual([
      { internalID: "offer-1", isPurchased: false },
      { internalID: "offer-2", isPurchased: true },
    ])
  })

  it("returns null when the conversation has no artwork item", async () => {
    const contextWithNoArtwork = {
      conversationLoader: () =>
        Promise.resolve({
          id: "conversation-1",
          from_id: "buyer-1",
          items: [],
        }),
      mePartnerOffersLoader,
    }

    const query = gql`
      {
        conversation(id: "conversation-1") {
          collectorPartnerOffersConnection(first: 10) {
            totalCount
          }
        }
      }
    `

    const data = await runQuery(query, contextWithNoArtwork)

    expect(data).toEqual({
      conversation: {
        collectorPartnerOffersConnection: null,
      },
    })
    expect(mePartnerOffersLoader).not.toHaveBeenCalled()
  })

  it("throws when mePartnerOffersLoader is unavailable (signed out)", async () => {
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
          collectorPartnerOffersConnection(first: 10) {
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
