import { runAuthenticatedQuery } from "schema/v2/test/utils"

const mockMutation = `
  mutation {
    createBuyerOffer(input: {
      orderId: "order-id",
      offerPrice: { amount: 850, currencyCode: "USD" },
      note: "My initial offer"
    }) {
      offerOrError {
        ...on OfferMutationError {
          mutationError {
            message
            code
          }
        }
        ...on OfferMutationSuccess {
          offer {
            internalID
            amount {
              minor
            }
            note
          }
        }
      }
    }
  }
`

let context

describe("createBuyerOfferMutation", () => {
  beforeEach(() => {
    context = {
      meOfferCreateLoader: jest.fn().mockResolvedValue({
        id: "offer-id",
        order_id: "order-id",
        amount_cents: 85000,
        buyer_total_cents: 90000,
        currency_code: "USD",
        from_participant: "BUYER",
        note: "My initial offer",
        shipping_total_cents: 5000,
        tax_total_cents: 0,
        created_at: "2024-01-01T00:00:00.000Z",
      }),
      meOrderLoader: jest.fn().mockResolvedValue({
        id: "order-id",
        mode: "offer",
        state: "pending",
        code: "order-code",
        currency_code: "USD",
      }),
    }
  })

  it("creates an offer on an order", async () => {
    const query = mockMutation
    const result = await runAuthenticatedQuery(query, context)

    expect(result.errors).toBeUndefined()
    expect(result).toEqual({
      createBuyerOffer: {
        offerOrError: {
          offer: {
            internalID: "offer-id",
            amount: {
              minor: 85000,
            },
            note: "My initial offer",
          },
        },
      },
    })

    expect(context.meOfferCreateLoader).toHaveBeenCalledWith(null, {
      order_id: "order-id",
      amount_cents: 85000,
      note: "My initial offer",
    })
  })

  it("creates an offer without a note", async () => {
    const query = `
      mutation {
        createBuyerOffer(input: {
          orderId: "order-id",
          offerPrice: { amount: 850, currencyCode: "USD" }
        }) {
          offerOrError {
            ...on OfferMutationSuccess {
              offer {
                internalID
                note
              }
            }
          }
        }
      }
    `

    context.meOfferCreateLoader = jest.fn().mockResolvedValue({
      id: "offer-id",
      order_id: "order-id",
      amount_cents: 85000,
      buyer_total_cents: 90000,
      currency_code: "USD",
      from_participant: "BUYER",
      note: null,
      shipping_total_cents: 5000,
      tax_total_cents: 0,
      created_at: "2024-01-01T00:00:00.000Z",
    })

    const result = await runAuthenticatedQuery(query, context)

    expect(result.errors).toBeUndefined()
    expect(result).toEqual({
      createBuyerOffer: {
        offerOrError: {
          offer: {
            internalID: "offer-id",
            note: null,
          },
        },
      },
    })

    expect(context.meOfferCreateLoader).toHaveBeenCalledWith(null, {
      order_id: "order-id",
      amount_cents: 85000,
    })
  })

  it("returns an error when the loader fails", async () => {
    context.meOfferCreateLoader = jest.fn().mockRejectedValue({
      statusCode: 422,
      body: {
        message: "order_not_pending",
        code: "order_not_pending",
      },
    })

    const query = mockMutation
    const result = await runAuthenticatedQuery(query, context)

    expect(result.errors).toBeUndefined()
    expect(result).toEqual({
      createBuyerOffer: {
        offerOrError: {
          mutationError: {
            message: "order_not_pending",
            code: "order_not_pending",
          },
        },
      },
    })
  })

  it("requires authentication", async () => {
    const query = mockMutation
    const result = await runAuthenticatedQuery(query, {})

    expect(result.errors).toBeUndefined()
    expect(result).toEqual({
      createBuyerOffer: {
        offerOrError: {
          mutationError: {
            message: "An error occurred",
            code: "internal_error",
          },
        },
      },
    })
  })
})
