import { runQuery } from "schema/v2/test/utils"
import gql from "lib/gql"

describe("partner.order", () => {
  let orderResponse
  let context

  beforeEach(() => {
    orderResponse = {
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
      fulfillment_type: "ship",
      shipping_name: "John Doe",
      shipping_address_line1: "123 Main St",
      shipping_city: "New York",
      shipping_region: "NY",
      shipping_postal_code: "10001",
      shipping_country: "US",
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
    }

    const partnerOrderLoader = jest.fn(({ partnerId: _partnerId, orderId }) => {
      if (orderId === "order-1") {
        return Promise.resolve(orderResponse)
      }
      throw new Error("Order not found")
    })

    context = {
      partnerLoader: () => {
        return Promise.resolve({
          id: "partner-id",
          _id: "partner-id",
        })
      },
      partnerOrderLoader,
    }
  })

  it("returns a single order for a partner", async () => {
    const query = gql`
      {
        partner(id: "partner-id") {
          order(id: "order-1") {
            internalID
            code
            currencyCode
            mode
            createdAt
          }
        }
      }
    `

    const data = await runQuery(query, context)
    expect(data).toEqual({
      partner: {
        order: {
          internalID: "order-1",
          code: "ORD001",
          currencyCode: "USD",
          mode: "BUY",
          createdAt: "2024-01-01T00:00:00Z",
        },
      },
    })
  })

  it("returns order with line items", async () => {
    const query = gql`
      {
        partner(id: "partner-id") {
          order(id: "order-1") {
            internalID
            lineItems {
              internalID
              quantity
            }
          }
        }
      }
    `

    const data = await runQuery(query, context)
    expect(data).toEqual({
      partner: {
        order: {
          internalID: "order-1",
          lineItems: [
            {
              internalID: "line-item-1",
              quantity: 1,
            },
          ],
        },
      },
    })
  })

  it("returns order with fulfillment details", async () => {
    const query = gql`
      {
        partner(id: "partner-id") {
          order(id: "order-1") {
            internalID
            fulfillmentDetails {
              name
              addressLine1
              city
              region
              postalCode
              country
            }
          }
        }
      }
    `

    const data = await runQuery(query, context)
    expect(data).toEqual({
      partner: {
        order: {
          internalID: "order-1",
          fulfillmentDetails: {
            name: "John Doe",
            addressLine1: "123 Main St",
            city: "New York",
            region: "NY",
            postalCode: "10001",
            country: "US",
          },
        },
      },
    })
  })

  it("returns null when partnerOrderLoader is not available", async () => {
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
          order(id: "order-1") {
            internalID
            code
          }
        }
      }
    `

    const data = await runQuery(query, contextWithoutLoader)

    expect(data).toEqual({
      partner: {
        order: null,
      },
    })
  })

  it("calls partnerOrderLoader with correct arguments", async () => {
    const query = gql`
      {
        partner(id: "partner-id") {
          order(id: "order-1") {
            internalID
          }
        }
      }
    `

    await runQuery(query, context)

    expect(context.partnerOrderLoader).toHaveBeenCalledWith({
      partnerId: "partner-id",
      orderId: "order-1",
    })
  })
})
