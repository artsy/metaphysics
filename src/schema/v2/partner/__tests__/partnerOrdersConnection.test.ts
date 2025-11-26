import { runQuery } from "schema/v2/test/utils"
import gql from "lib/gql"

describe("partner.ordersConnection", () => {
  let ordersResponse
  let context

  beforeEach(() => {
    ordersResponse = [
      {
        id: "order-1",
        code: "ORD001",
        mode: "buy",
        created_at: "2024-01-01T00:00:00Z",
        currency_code: "USD",
        buyer_id: "buyer-1",
        buyer_type: "User",
        seller_id: "partner-id",
        seller_type: "Partner",
        items_total_cents: 100000,
        shipping_total_cents: 2000,
        tax_total_cents: 8000,
        seller_total_cents: 110000,
        commission_fee_cents: 5000,
        transaction_fee_cents: 300,
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
        shipping_total_cents: 1000,
        tax_total_cents: 4000,
        seller_total_cents: 55000,
        commission_fee_cents: 2500,
        transaction_fee_cents: 150,
        impulse_conversation_id: "conversation-1",
        line_items: [
          {
            id: "line-item-2",
            artwork_id: "artwork-2",
            list_price_cents: 50000,
            quantity: 1,
            currency_code: "USD",
          },
        ],
        submitted_offers: [],
      },
    ]

    const partnerOrdersLoader = jest.fn((_partnerId, params) => {
      let filteredOrders = [...ordersResponse]

      if (params.artwork_id) {
        filteredOrders = filteredOrders.filter((order) =>
          order.line_items.some((li) => li.artwork_id === params.artwork_id)
        )
      }

      if (params.conversation_id) {
        filteredOrders = filteredOrders.filter(
          (order) => order.impulse_conversation_id === params.conversation_id
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
      partnerLoader: () => {
        return Promise.resolve({
          id: "partner-id",
          _id: "partner-id",
        })
      },
      partnerOrdersLoader,
    }
  })

  it("returns orders for a partner", async () => {
    const query = gql`
      {
        partner(id: "partner-id") {
          ordersConnection(first: 5) {
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
      partner: {
        ordersConnection: {
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
  })

  it("filters orders by artworkID", async () => {
    const query = gql`
      {
        partner(id: "partner-id") {
          ordersConnection(first: 5, artworkID: "artwork-1") {
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
      partner: {
        ordersConnection: {
          edges: [
            {
              node: {
                internalID: "order-1",
                code: "ORD001",
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
      })
    )
  })

  it("filters orders by conversationID", async () => {
    const query = gql`
      {
        partner(id: "partner-id") {
          ordersConnection(first: 5, conversationID: "conversation-1") {
            edges {
              node {
                internalID
                code
                impulseConversationId
              }
            }
          }
        }
      }
    `

    const data = await runQuery(query, context)
    expect(data).toEqual({
      partner: {
        ordersConnection: {
          edges: [
            {
              node: {
                internalID: "order-2",
                code: "ORD002",
                impulseConversationId: "conversation-1",
              },
            },
          ],
        },
      },
    })

    expect(context.partnerOrdersLoader).toHaveBeenCalledWith(
      "partner-id",
      expect.objectContaining({
        conversation_id: "conversation-1",
      })
    )
  })

  it("returns hasNextPage=true when first is below total", async () => {
    const query = gql`
      {
        partner(id: "partner-id") {
          ordersConnection(first: 1) {
            pageInfo {
              hasNextPage
            }
          }
        }
      }
    `

    const data = await runQuery(query, context)

    expect(data).toEqual({
      partner: {
        ordersConnection: {
          pageInfo: {
            hasNextPage: true,
          },
        },
      },
    })
  })

  it("returns hasNextPage=false when first is above total", async () => {
    const query = gql`
      {
        partner(id: "partner-id") {
          ordersConnection(first: 5) {
            pageInfo {
              hasNextPage
            }
          }
        }
      }
    `

    const data = await runQuery(query, context)

    expect(data).toEqual({
      partner: {
        ordersConnection: {
          pageInfo: {
            hasNextPage: false,
          },
        },
      },
    })
  })

  it("loads the total count", async () => {
    const query = gql`
      {
        partner(id: "partner-id") {
          ordersConnection(first: 5) {
            totalCount
          }
        }
      }
    `

    const data = await runQuery(query, context)

    expect(data).toEqual({
      partner: {
        ordersConnection: {
          totalCount: 2,
        },
      },
    })
  })

  it("returns null when partnerOrdersLoader is not available", async () => {
    const contextWithoutLoader = {
      partnerLoader: () => {
        return Promise.resolve({
          id: "partner-id",
          _id: "partner-id",
        })
      },
    }

    const query = gql`
      {
        partner(id: "partner-id") {
          ordersConnection(first: 5) {
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
      partner: {
        ordersConnection: null,
      },
    })
  })
})
