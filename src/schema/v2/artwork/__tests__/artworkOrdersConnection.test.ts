import { runQuery } from "schema/v2/test/utils"
import gql from "lib/gql"

describe("artwork.ordersConnection", () => {
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
      artworkLoader: () => {
        return Promise.resolve({
          id: "artwork-1",
          _id: "artwork-1",
          title: "Test Artwork",
        })
      },
      meOrdersLoader,
      partnerOrdersLoader,
    }
  })

  it("returns orders for an artwork using meOrdersLoader", async () => {
    const query = gql`
      {
        artwork(id: "artwork-1") {
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
      artwork: {
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

    expect(context.meOrdersLoader).toHaveBeenCalledWith(
      expect.objectContaining({
        artwork_id: "artwork-1",
      })
    )
  })

  it("returns orders for an artwork using partnerOrdersLoader when partnerID is provided", async () => {
    const query = gql`
      {
        artwork(id: "artwork-1") {
          ordersConnection(first: 5, partnerID: "partner-id") {
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
      artwork: {
        ordersConnection: {
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
      })
    )
  })

  it("returns hasNextPage=true when first is below total", async () => {
    const query = gql`
      {
        artwork(id: "artwork-1") {
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
      artwork: {
        ordersConnection: {
          pageInfo: {
            hasNextPage: true,
          },
        },
      },
    })
  })

  it("returns totalCount", async () => {
    const query = gql`
      {
        artwork(id: "artwork-1") {
          ordersConnection(first: 5) {
            totalCount
          }
        }
      }
    `

    const data = await runQuery(query, context)

    expect(data).toEqual({
      artwork: {
        ordersConnection: {
          totalCount: 2,
        },
      },
    })
  })

  it("returns null when meOrdersLoader is not available and no partnerID provided", async () => {
    const contextWithoutLoader = {
      artworkLoader: () => {
        return Promise.resolve({
          id: "artwork-1",
          _id: "artwork-1",
        })
      },
    }

    const query = gql`
      {
        artwork(id: "artwork-1") {
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
      artwork: {
        ordersConnection: null,
      },
    })
  })

  it("returns null when partnerOrdersLoader is not available but partnerID is provided", async () => {
    const contextWithoutPartnerLoader = {
      artworkLoader: () => {
        return Promise.resolve({
          id: "artwork-1",
          _id: "artwork-1",
        })
      },
      meOrdersLoader: context.meOrdersLoader,
    }

    const query = gql`
      {
        artwork(id: "artwork-1") {
          ordersConnection(first: 5, partnerID: "partner-id") {
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
      artwork: {
        ordersConnection: null,
      },
    })
  })
})
