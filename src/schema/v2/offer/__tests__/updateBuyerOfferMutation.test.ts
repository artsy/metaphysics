import { runAuthenticatedQuery } from "schema/v2/test/utils"

const mockMutation = `
  mutation {
    updateBuyerOffer(input: {
      offerId: "offer-id",
      amountMinor: 90000,
      note: "Updated note"
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

describe("updateBuyerOfferMutation", () => {
  beforeEach(() => {
    context = {
      meOfferUpdateLoader: jest.fn().mockResolvedValue({
        id: "offer-id",
        order_id: "order-id",
        amount_cents: 90000,
        buyer_total_cents: 95000,
        currency_code: "USD",
        from_participant: "BUYER",
        note: "Updated note",
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

  it("updates an offer with new price and note", async () => {
    const query = mockMutation
    const result = await runAuthenticatedQuery(query, context)

    expect(result.errors).toBeUndefined()
    expect(result).toEqual({
      updateBuyerOffer: {
        offerOrError: {
          offer: {
            internalID: "offer-id",
            amount: {
              minor: 90000,
            },
            note: "Updated note",
          },
        },
      },
    })

    expect(context.meOfferUpdateLoader).toHaveBeenCalledWith("offer-id", {
      amount_cents: 90000,
      note: "Updated note",
    })
  })

  it("updates only the offer price", async () => {
    const query = `
      mutation {
        updateBuyerOffer(input: {
          offerId: "offer-id",
          amountMinor: 95000
        }) {
          offerOrError {
            ...on OfferMutationSuccess {
              offer {
                internalID
                amount {
                  minor
                }
              }
            }
          }
        }
      }
    `

    context.meOfferUpdateLoader = jest.fn().mockResolvedValue({
      id: "offer-id",
      order_id: "order-id",
      amount_cents: 95000,
      buyer_total_cents: 100000,
      currency_code: "USD",
      from_participant: "BUYER",
      note: "Original note",
      shipping_total_cents: 5000,
      tax_total_cents: 0,
      created_at: "2024-01-01T00:00:00.000Z",
    })

    const result = await runAuthenticatedQuery(query, context)

    expect(result.errors).toBeUndefined()
    expect(result).toEqual({
      updateBuyerOffer: {
        offerOrError: {
          offer: {
            internalID: "offer-id",
            amount: {
              minor: 95000,
            },
          },
        },
      },
    })

    expect(context.meOfferUpdateLoader).toHaveBeenCalledWith("offer-id", {
      amount_cents: 95000,
    })
  })

  it("updates only the note", async () => {
    const query = `
      mutation {
        updateBuyerOffer(input: {
          offerId: "offer-id",
          note: "Just updating the note"
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

    context.meOfferUpdateLoader = jest.fn().mockResolvedValue({
      id: "offer-id",
      order_id: "order-id",
      amount_cents: 85000,
      buyer_total_cents: 90000,
      currency_code: "USD",
      from_participant: "BUYER",
      note: "Just updating the note",
      shipping_total_cents: 5000,
      tax_total_cents: 0,
      created_at: "2024-01-01T00:00:00.000Z",
    })

    const result = await runAuthenticatedQuery(query, context)

    expect(result.errors).toBeUndefined()
    expect(result).toEqual({
      updateBuyerOffer: {
        offerOrError: {
          offer: {
            internalID: "offer-id",
            note: "Just updating the note",
          },
        },
      },
    })

    expect(context.meOfferUpdateLoader).toHaveBeenCalledWith("offer-id", {
      note: "Just updating the note",
    })
  })

  it("can clear the note by passing null", async () => {
    const query = `
      mutation {
        updateBuyerOffer(input: {
          offerId: "offer-id",
          note: null
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

    context.meOfferUpdateLoader = jest.fn().mockResolvedValue({
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
      updateBuyerOffer: {
        offerOrError: {
          offer: {
            internalID: "offer-id",
            note: null,
          },
        },
      },
    })

    expect(context.meOfferUpdateLoader).toHaveBeenCalledWith("offer-id", {
      note: null,
    })
  })

  it("returns an error when the loader fails", async () => {
    context.meOfferUpdateLoader = jest.fn().mockRejectedValue({
      statusCode: 422,
      body: {
        message: "cannot_update_submitted_offer",
        code: "cannot_update_submitted_offer",
      },
    })

    const query = mockMutation
    const result = await runAuthenticatedQuery(query, context)

    expect(result.errors).toBeUndefined()
    expect(result).toEqual({
      updateBuyerOffer: {
        offerOrError: {
          mutationError: {
            message: "cannot_update_submitted_offer",
            code: "cannot_update_submitted_offer",
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
      updateBuyerOffer: {
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
