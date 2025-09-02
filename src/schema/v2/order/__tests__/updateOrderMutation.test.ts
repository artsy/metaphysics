import { runAuthenticatedQuery } from "schema/v2/test/utils"
import { baseArtwork, baseOrderJson } from "./support"

const mockMutation = `
  mutation {
    updateOrder(input: {
      id: "order-id",
      paymentMethod: CREDIT_CARD,
      creditCardWalletType: APPLE_PAY
      stripeConfirmationToken: "ctoken_123"
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
        stripe_confirmation_token: "ctoken_123",
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
      stripe_confirmation_token: "ctoken_123",
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

  it("returns correct region code when both phoneNumber and phoneNumberCountryCode are provided", async () => {
    context.meOrderUpdateLoader = jest.fn().mockResolvedValue({
      ...baseOrderJson,
      id: "order-id",
      buyer_phone_number: "5142250543",
      buyer_phone_number_country_code: "ca",
    })

    const phoneNumberQuery = `
      mutation {
        updateOrder(input: {
          id: "order-id",
          paymentMethod: CREDIT_CARD
        }) {
          orderOrError {
            ...on OrderMutationSuccess {
              order {
                internalID
                fulfillmentDetails {
                  phoneNumber {
                    originalNumber
                    regionCode
                    countryCode
                    isValid
                    display(format: NATIONAL)
                  }
                  phoneNumberCountryCode
                }
              }
            }
          }
        }
      }
    `

    const result = await runAuthenticatedQuery(phoneNumberQuery, context)

    expect(result.errors).toBeUndefined()
    expect(
      result.updateOrder.orderOrError.order.fulfillmentDetails.phoneNumber
    ).toEqual({
      originalNumber: "5142250543",
      regionCode: "ca",
      countryCode: "1",
      isValid: true,
      display: "(514) 225-0543", // National format for CA
    })
    expect(
      result.updateOrder.orderOrError.order.fulfillmentDetails
        .phoneNumberCountryCode
    ).toBe("ca")
  })

  it("derives region code from phone number when phoneNumberCountryCode is not provided", async () => {
    context.meOrderUpdateLoader = jest.fn().mockResolvedValue({
      ...baseOrderJson,
      id: "order-id",
      buyer_phone_number: "+1 415 555-0132",
      buyer_phone_number_country_code: null,
    })

    const phoneNumberQuery = `
      mutation {
        updateOrder(input: {
          id: "order-id",
          paymentMethod: CREDIT_CARD
        }) {
          orderOrError {
            ...on OrderMutationSuccess {
              order {
                internalID
                fulfillmentDetails {
                  phoneNumber {
                    originalNumber
                    regionCode
                    countryCode
                    isValid
                    display(format: NATIONAL)
                  }
                  phoneNumberCountryCode
                }
              }
            }
          }
        }
      }
    `

    const result = await runAuthenticatedQuery(phoneNumberQuery, context)

    expect(result.errors).toBeUndefined()
    expect(
      result.updateOrder.orderOrError.order.fulfillmentDetails.phoneNumber
    ).toEqual({
      originalNumber: "+1 415 555-0132",
      regionCode: "us",
      countryCode: "1",
      isValid: true,
      display: "(415) 555-0132",
    })
    expect(
      result.updateOrder.orderOrError.order.fulfillmentDetails
        .phoneNumberCountryCode
    ).toBe(null)
  })
})
