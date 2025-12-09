import { runQuery } from "schema/v2/test/utils"
import gql from "lib/gql"

describe("conversation orders connections", () => {
  let ordersResponse
  let context

  beforeEach(() => {
    ordersResponse = [
      {
        id: "order-1",
        code: "ORD001",
        mode: "offer",
        created_at: "2024-01-01T00:00:00Z",
        currency_code: "USD",
        buyer_id: "buyer-1",
        buyer_type: "User",
        seller_id: "partner-id",
        seller_type: "Partner",
        items_total_cents: 100000,
        impulse_conversation_id: "conversation-1",
        line_items: [
          {
            id: "line-item-1",
            artwork_id: "artwork-1",
            list_price_cents: 100000,
            quantity: 1,
            currency_code: "USD",
          },
        ],
        submitted_offers: [],
      },
      {
        id: "order-2",
        code: "ORD002",
        mode: "offer",
        created_at: "2024-01-02T00:00:00Z",
        currency_code: "USD",
        buyer_id: "buyer-2",
        buyer_type: "User",
        seller_id: "partner-id",
        seller_type: "Partner",
        items_total_cents: 50000,
        impulse_conversation_id: "conversation-1",
        line_items: [
          {
            id: "line-item-2",
            artwork_id: "artwork-1",
            list_price_cents: 50000,
            quantity: 1,
            currency_code: "USD",
          },
        ],
        submitted_offers: [],
      },
    ]

    const meOrdersLoader = jest.fn((params) => {
      let filteredOrders = [...ordersResponse]

      if (params.artwork_id) {
        filteredOrders = filteredOrders.filter((order) =>
          order.line_items.some((li) => li.artwork_id === params.artwork_id)
        )
      }

      return Promise.resolve({
        body: filteredOrders,
        headers: {
          "x-total-count": filteredOrders.length.toString(),
        },
      })
    })

    const partnerOrdersLoader = jest.fn((_partnerId, params) => {
      let filteredOrders = [...ordersResponse]

      if (params.artwork_id) {
        filteredOrders = filteredOrders.filter((order) =>
          order.line_items.some((li) => li.artwork_id === params.artwork_id)
        )
      }

      return Promise.resolve({
        body: filteredOrders,
        headers: {
          "x-total-count": filteredOrders.length.toString(),
        },
      })
    })

    context = {
      conversationLoader: () => {
        return Promise.resolve({
          id: "conversation-1",
          inquiry_id: "inquiry-1",
          from_id: "buyer-1",
          from_type: "User",
          from_name: "Test User",
          from_email: "test@example.com",
          to_id: "partner-id",
          to_type: "Partner",
          to_name: "Test Partner",
          to: ["partner-id"],
          items: [
            {
              item_type: "Artwork",
              item_id: "artwork-1",
              properties: {
                id: "artwork-bson_id",
                _id: "artwork-1",
              },
            },
          ],
        })
      },
      meOrdersLoader,
      partnerOrdersLoader,
    }
  })

  it("returns orders for a conversation using collectorOrdersConnection", async () => {
    const query = gql`
      {
        conversation(id: "conversation-1") {
          collectorOrdersConnection(first: 5) {
            edges {
              node {
                internalID
                code
                currencyCode
              }
            }
          }
        }
      }
    `

    const data = await runQuery(query, context)
    expect(data).toEqual({
      conversation: {
        collectorOrdersConnection: {
          edges: [
            {
              node: {
                internalID: "order-1",
                code: "ORD001",
                currencyCode: "USD",
              },
            },
            {
              node: {
                internalID: "order-2",
                code: "ORD002",
                currencyCode: "USD",
              },
            },
          ],
        },
      },
    })

    expect(context.meOrdersLoader).toHaveBeenCalledWith(
      expect.objectContaining({
        artwork_id: "artwork-1",
      })
    )
  })

  it("returns orders for a conversation using partnerOrdersConnection", async () => {
    const query = gql`
      {
        conversation(id: "conversation-1") {
          partnerOrdersConnection(first: 5, partnerID: "partner-id") {
            edges {
              node {
                internalID
                code
              }
            }
          }
        }
      }
    `

    const data = await runQuery(query, context)
    expect(data).toEqual({
      conversation: {
        partnerOrdersConnection: {
          edges: [
            {
              node: {
                internalID: "order-1",
                code: "ORD001",
              },
            },
            {
              node: {
                internalID: "order-2",
                code: "ORD002",
              },
            },
          ],
        },
      },
    })

    expect(context.partnerOrdersLoader).toHaveBeenCalledWith(
      "partner-id",
      expect.objectContaining({
        artwork_id: "artwork-1",
        buyer_id: "buyer-1",
      })
    )
  })

  it("returns hasNextPage=true when first is below total for collectorOrdersConnection", async () => {
    const query = gql`
      {
        conversation(id: "conversation-1") {
          collectorOrdersConnection(first: 1) {
            pageInfo {
              hasNextPage
            }
          }
        }
      }
    `

    const data = await runQuery(query, context)

    expect(data).toEqual({
      conversation: {
        collectorOrdersConnection: {
          pageInfo: {
            hasNextPage: true,
          },
        },
      },
    })
  })

  it("returns totalCount for collectorOrdersConnection", async () => {
    const query = gql`
      {
        conversation(id: "conversation-1") {
          collectorOrdersConnection(first: 5) {
            totalCount
          }
        }
      }
    `

    const data = await runQuery(query, context)

    expect(data).toEqual({
      conversation: {
        collectorOrdersConnection: {
          totalCount: 2,
        },
      },
    })
  })

  it("returns null when meOrdersLoader is not available for collectorOrdersConnection", async () => {
    const contextWithoutLoader = {
      conversationLoader: () => {
        return Promise.resolve({
          id: "conversation-1",
          items: [
            {
              item_type: "Artwork",
              item_id: "artwork-1",
              properties: {
                id: "artwork-bson_id",
                _id: "artwork-1",
              },
            },
          ],
        })
      },
    }

    const query = gql`
      {
        conversation(id: "conversation-1") {
          collectorOrdersConnection(first: 5) {
            edges {
              node {
                code
              }
            }
          }
        }
      }
    `

    const data = await runQuery(query, contextWithoutLoader)

    expect(data).toEqual({
      conversation: {
        collectorOrdersConnection: null,
      },
    })
  })

  it("returns null when partnerOrdersLoader is not available for partnerOrdersConnection", async () => {
    const contextWithoutPartnerLoader = {
      conversationLoader: () => {
        return Promise.resolve({
          id: "conversation-1",
          items: [
            {
              item_type: "Artwork",
              item_id: "artwork-1",
              properties: {
                id: "artwork-bson_id",
                _id: "artwork-1",
              },
            },
          ],
        })
      },
      meOrdersLoader: context.meOrdersLoader,
    }

    const query = gql`
      {
        conversation(id: "conversation-1") {
          partnerOrdersConnection(first: 5, partnerID: "partner-id") {
            edges {
              node {
                code
              }
            }
          }
        }
      }
    `

    const data = await runQuery(query, contextWithoutPartnerLoader)

    expect(data).toEqual({
      conversation: {
        partnerOrdersConnection: null,
      },
    })
  })

  it("returns empty connection when conversation has no artworks for collectorOrdersConnection", async () => {
    const contextWithNoArtworks = {
      conversationLoader: () => {
        return Promise.resolve({
          id: "conversation-1",
          items: [],
        })
      },
      meOrdersLoader: context.meOrdersLoader,
    }

    const query = gql`
      {
        conversation(id: "conversation-1") {
          collectorOrdersConnection(first: 5) {
            edges {
              node {
                code
              }
            }
            totalCount
          }
        }
      }
    `

    const data = await runQuery(query, contextWithNoArtworks)

    expect(data).toEqual({
      conversation: {
        collectorOrdersConnection: {
          edges: [],
          totalCount: 0,
        },
      },
    })
  })

  it("automatically filters orders by buyer_id from conversation.from_id for partnerOrdersConnection", async () => {
    const query = gql`
      {
        conversation(id: "conversation-1") {
          partnerOrdersConnection(first: 5, partnerID: "partner-id") {
            edges {
              node {
                internalID
                code
              }
            }
          }
        }
      }
    `

    await runQuery(query, context)

    expect(context.partnerOrdersLoader).toHaveBeenCalledWith(
      "partner-id",
      expect.objectContaining({
        artwork_id: "artwork-1",
        buyer_id: "buyer-1",
      })
    )
  })
})
