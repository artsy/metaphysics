import { runAuthenticatedQuery } from "schema/v2/test/utils"
import { baseArtwork, baseOrderJson } from "./support"

const mockMutation = `
  mutation {
    updateOrder(input: {
      id: "order-id",
      paymentMethod: CREDIT_CARD,
      creditCardWalletType: APPLE_PAY
    }) {
      orderOrError {
        ...on OrderMutationError {
          mutationError {
            message
            code
          }
        }
        ...on OrderMutationSuccess {
          order {
            internalID
          }
        }
      }
    }
  }
`

let context
describe("updateOrderMutation", () => {
  beforeEach(() => {
    context = {
      meOrderUpdateLoader: jest.fn().mockResolvedValue({
        ...baseOrderJson,
        id: "order-id",
        source: "artwork_page",
        code: "order-code",
        mode: "buy",
        currency_code: "USD",
        payment_method: "credit card",
        credit_card_wallet_type: "apple_pay",
      }),
      artworkLoader: jest.fn().mockResolvedValue({ ...baseArtwork }),
      artworkVersionLoader: jest
        .fn()
        .mockResolvedValue({ ...baseArtwork, id: "artwork-version-id" }),
    }
  })
  it("should update an order with all fields", async () => {
    const result = await runAuthenticatedQuery(mockMutation, context)

    expect(result.errors).toBeUndefined()
    expect(result).toEqual({
      updateOrder: {
        orderOrError: {
          order: {
            internalID: "order-id",
          },
        },
      },
    })

    expect(context.meOrderUpdateLoader).toHaveBeenCalledWith("order-id", {
      payment_method: "credit card",
      credit_card_wallet_type: "apple_pay",
    })
  })

  it("only sends the fields that are provided (including Null", async () => {
    const result = await runAuthenticatedQuery(
      `
      mutation {
        updateOrder(input: {
          id: "order-id",
          paymentMethod: null
        }) {
          orderOrError {
            ...on OrderMutationSuccess {
              order {
                internalID
              }
            }
          }
        }
      }
    `,
      context
    )

    expect(result.updateOrder.orderOrError.order).toBeDefined()
    expect(result).toEqual({
      updateOrder: {
        orderOrError: {
          order: {
            internalID: "order-id",
          },
        },
      },
    })

    expect(context.meOrderUpdateLoader).toHaveBeenCalledWith("order-id", {
      payment_method: null,
    })
  })

  it("propagates an error", async () => {
    context.meOrderUpdateLoader = jest
      .fn()
      .mockRejectedValue(new Error("Oops - Error updating order"))
    const result = await runAuthenticatedQuery(mockMutation, context)

    expect(result.errors).toBeUndefined()
    expect(result).toEqual({
      updateOrder: {
        orderOrError: {
          mutationError: {
            message: "An error occurred",
            code: "internal_error",
          },
        },
      },
    })
  })

  it("propagates a 422 error from exchange", async () => {
    context.meOrderUpdateLoader = jest.fn().mockRejectedValue({
      statusCode: 422,
      body: {
        message: "order_not_pending: submitted",
        code: "order_not_pending",
      },
    })
    const result = await runAuthenticatedQuery(mockMutation, context)

    expect(result.errors).toBeUndefined()
    expect(result).toEqual({
      updateOrder: {
        orderOrError: {
          mutationError: {
            message: "order_not_pending: submitted",
            code: "order_not_pending",
          },
        },
      },
    })
  })
})
