import { runAuthenticatedQuery } from "schema/v2/test/utils"
import { baseArtwork, baseOrderJson } from "./support"

const mockMutation = `
  mutation {
    setOrderPaymentByStripeSetupIntent(input: {
      id: "order-id",
      setupIntentId: "seti_123456789",
      oneTimeUse: false
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
describe("setOrderPaymentByStripeSetupIntentMutation", () => {
  beforeEach(() => {
    context = {
      meOrderUpdateLoader: jest.fn().mockResolvedValue({
        ...baseOrderJson,
        id: "order-id",
        source: "artwork_page",
        code: "order-code",
        mode: "buy",
        currency_code: "USD",
        payment_method: "us_bank_account",
      }),
      artworkLoader: jest.fn().mockResolvedValue({ ...baseArtwork }),
      artworkVersionLoader: jest
        .fn()
        .mockResolvedValue({ ...baseArtwork, id: "artwork-version-id" }),
    }
  })

  it("should set payment using stripe setup intent", async () => {
    const result = await runAuthenticatedQuery(mockMutation, context)

    expect(result.errors).toBeUndefined()
    expect(result).toEqual({
      setOrderPaymentByStripeSetupIntent: {
        orderOrError: {
          order: {
            internalID: "order-id",
          },
        },
      },
    })

    expect(context.meOrderUpdateLoader).toHaveBeenCalledWith("order-id", {
      setup_intent_id: "seti_123456789",
      setup_intent_one_time_use: false,
    })
  })

  it("should handle oneTimeUse set to true", async () => {
    const mutationWithOneTimeUse = `
      mutation {
        setOrderPaymentByStripeSetupIntent(input: {
          id: "order-id",
          setupIntentId: "seti_123456789",
          oneTimeUse: true
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
    `

    const result = await runAuthenticatedQuery(mutationWithOneTimeUse, context)

    expect(result.errors).toBeUndefined()
    expect(context.meOrderUpdateLoader).toHaveBeenCalledWith("order-id", {
      setup_intent_id: "seti_123456789",
      setup_intent_one_time_use: true,
    })
  })

  it("propagates an error", async () => {
    context.meOrderUpdateLoader = jest
      .fn()
      .mockRejectedValue(new Error("Oops - Error setting payment"))
    const result = await runAuthenticatedQuery(mockMutation, context)

    expect(result.errors).toBeUndefined()
    expect(result).toEqual({
      setOrderPaymentByStripeSetupIntent: {
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
      setOrderPaymentByStripeSetupIntent: {
        orderOrError: {
          mutationError: {
            message: "order_not_pending: submitted",
            code: "order_not_pending",
          },
        },
      },
    })
  })

  it("throws an error when user is not authenticated", async () => {
    const unauthenticatedContext = {
      meOrderUpdateLoader: undefined,
      artworkLoader: jest.fn().mockResolvedValue({ ...baseArtwork }),
      artworkVersionLoader: jest
        .fn()
        .mockResolvedValue({ ...baseArtwork, id: "artwork-version-id" }),
    }

    await expect(
      runAuthenticatedQuery(mockMutation, unauthenticatedContext)
    ).rejects.toThrow("You need to be signed in to perform this action")
  })
})
