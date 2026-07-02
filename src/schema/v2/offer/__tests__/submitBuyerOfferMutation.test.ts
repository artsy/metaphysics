import { runAuthenticatedQuery } from "schema/v2/test/utils"

const mockMutation = `
  mutation {
    submitBuyerOffer(input: {
      orderID: "order-id",
      offerID: "offer-id"
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
          }
        }
      }
    }
  }
`

let context

describe("submitBuyerOfferMutation", () => {
  beforeEach(() => {
    context = {
      meOfferSubmitLoader: jest.fn().mockResolvedValue({
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
      }),
    }
  })

  it("submits a pending offer and returns the offer", async () => {
    const result = await runAuthenticatedQuery(mockMutation, context)

    expect(result.errors).toBeUndefined()
    expect(result).toEqual({
      submitBuyerOffer: {
        offerOrError: {
          offer: {
            internalID: "offer-id",
          },
        },
      },
    })

    expect(context.meOfferSubmitLoader).toHaveBeenCalledWith({
      orderID: "order-id",
      offerID: "offer-id",
    })
  })

  it("returns a 422 exchange error", async () => {
    context.meOfferSubmitLoader = jest.fn().mockRejectedValue({
      statusCode: 422,
      body: {
        message: "invalid_state",
        code: "invalid_state",
      },
    })

    const result = await runAuthenticatedQuery(mockMutation, context)

    expect(result.errors).toBeUndefined()
    expect(result).toEqual({
      submitBuyerOffer: {
        offerOrError: {
          mutationError: {
            message: "invalid_state",
            code: "invalid_state",
          },
        },
      },
    })
  })

  it("returns a generic error when the loader fails", async () => {
    context.meOfferSubmitLoader = jest
      .fn()
      .mockRejectedValue(new Error("Something went wrong"))

    const result = await runAuthenticatedQuery(mockMutation, context)

    expect(result.errors).toBeUndefined()
    expect(result).toEqual({
      submitBuyerOffer: {
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
