import { runAuthenticatedQuery } from "schema/v2/test/utils"
import { baseArtwork, baseOrderJson } from "./support"

const mockMutation = `
  mutation {
    submitOrder(input: {
      id: "order-id",
      confirmationToken: "ctoken_123",
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
describe("submitOrderMutation", () => {
  beforeEach(() => {
    context = {
      meOrderSubmitLoader: jest.fn().mockResolvedValue({
        ...baseOrderJson,
        id: "order-id",
        source: "artwork_page",
        code: "order-code",
        mode: "buy",
        currency_code: "USD",
        payment_method: "credit card",
        credit_card_wallet_type: "apple_pay",
        buyer_total_cents: null,
        items_total_cents: 500000,
        shipping_total_cents: 2000,
        buyer_phone_number: "123-456-7890",
        buyer_phone_number_country_code: "+1",
        shipping_name: "John Doe",
        shipping_country: "US",
        shipping_postal_code: "10001",
        shipping_region: "NY",
        shipping_city: "New York",
        shipping_address_line1: "123 Main St",
        shipping_address_line2: "Apt 4B",
      }),
      artworkLoader: jest.fn().mockResolvedValue({ ...baseArtwork }),
      artworkVersionLoader: jest
        .fn()
        .mockResolvedValue({ ...baseArtwork, id: "artwork-version-id" }),
    }
  })

  it("submits an order", async () => {
    const result = await runAuthenticatedQuery(mockMutation, context)

    expect(result.errors).toBeUndefined()
    expect(result).toEqual({
      submitOrder: {
        orderOrError: {
          order: {
            internalID: "order-id",
          },
        },
      },
    })

    expect(context.meOrderSubmitLoader).toHaveBeenCalledWith("order-id", {
      confirmation_token: "ctoken_123",
      one_time_use: false,
    })
  })

  it("submits an order without oneTimeUse", async () => {
    const mockMutationWithoutOneTimeUse = `
      mutation {
        submitOrder(input: {
          id: "order-id",
          confirmationToken: "ctoken_123",
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

    const result = await runAuthenticatedQuery(
      mockMutationWithoutOneTimeUse,
      context
    )

    expect(result).toEqual({
      submitOrder: { orderOrError: { order: { internalID: "order-id" } } },
    })

    expect(context.meOrderSubmitLoader).toHaveBeenCalledWith("order-id", {
      confirmation_token: "ctoken_123",
    })
  })

  it("propagates an unexpected error", async () => {
    context.meOrderSubmitLoader = jest
      .fn()
      .mockRejectedValue(new Error("Oops - Error submitting order"))
    const result = await runAuthenticatedQuery(mockMutation, context)

    expect(result.errors).toBeUndefined()
    expect(result).toEqual({
      submitOrder: {
        orderOrError: {
          mutationError: {
            // fallback message for a non-exchange formatted error
            message: "An error occurred",
            code: "internal_error",
          },
        },
      },
    })
  })

  it("propagates a proper exchange error", async () => {
    context.meOrderSubmitLoader = jest.fn().mockRejectedValue({
      statusCode: 422,
      body: {
        code: "create_credit_card_failed",
      },
    })
    const result = await runAuthenticatedQuery(mockMutation, context)

    expect(result.errors).toBeUndefined()
    expect(result).toEqual({
      submitOrder: {
        orderOrError: {
          mutationError: {
            // fallback message for a non-exchange formatted error
            message: "An error occurred",
            code: "create_credit_card_failed",
          },
        },
      },
    })
  })
})
