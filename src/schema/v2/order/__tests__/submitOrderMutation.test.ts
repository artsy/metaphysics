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
        ...on OrderMutationActionRequired {
          actionData {
            clientSecret
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
      offer_id: undefined,
      confirmed_setup_intent_id: undefined,
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
      one_time_use: undefined,
      offer_id: undefined,
      confirmed_setup_intent_id: undefined,
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

  it("handles payment_requires_action error with action required response", async () => {
    context.meOrderSubmitLoader = jest.fn().mockRejectedValue({
      statusCode: 422,
      body: {
        code: "payment_requires_action",
        action_data: {
          client_secret: "pi_test_1234567890_secret_abc123",
        },
      },
    })
    const result = await runAuthenticatedQuery(mockMutation, context)

    expect(result.errors).toBeUndefined()
    expect(result).toEqual({
      submitOrder: {
        orderOrError: {
          actionData: {
            clientSecret: "pi_test_1234567890_secret_abc123",
          },
        },
      },
    })
  })

  it("submits an order with offerID", async () => {
    const mockMutationWithOfferID = `
      mutation {
        submitOrder(input: {
          id: "order-id",
          confirmationToken: "ctoken_123",
          oneTimeUse: false,
          offerID: "offer-id"
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

    const result = await runAuthenticatedQuery(mockMutationWithOfferID, context)

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
      offer_id: "offer-id",
      confirmed_setup_intent_id: undefined,
    })
  })

  it("submits an order with offerID and confirmedSetupIntentId", async () => {
    const mockMutationWithOfferIDAndSetupIntent = `
      mutation {
        submitOrder(input: {
          id: "order-id",
          offerID: "offer-id",
          confirmedSetupIntentId: "seti_123",
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

    const result = await runAuthenticatedQuery(
      mockMutationWithOfferIDAndSetupIntent,
      context
    )

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
      confirmation_token: undefined,
      one_time_use: false,
      offer_id: "offer-id",
      confirmed_setup_intent_id: "seti_123",
    })
  })

  describe("offer order inquiry creation", () => {
    beforeEach(() => {
      context.submitArtworkInquiryRequestLoader = jest
        .fn()
        .mockResolvedValue({})
    })

    it("creates an inquiry when submitting an offer order with a note", async () => {
      context.meOrderSubmitLoader = jest.fn().mockResolvedValue({
        ...baseOrderJson,
        id: "order-id",
        source: "artwork_page",
        mode: "offer",
        last_submitted_offer: {
          note: "I love this piece!",
          amount_cents: 100000,
          currency_code: "USD",
        },
        line_items: [{ artwork_id: "artwork-id" }],
      })

      const result = await runAuthenticatedQuery(mockMutation, context)

      expect(result.errors).toBeUndefined()
      expect(context.submitArtworkInquiryRequestLoader).toHaveBeenCalledWith({
        artwork: "artwork-id",
        message: "I love this piece!",
        order_id: "order-id",
      })
    })

    it("creates an inquiry with default message when note is null", async () => {
      context.meOrderSubmitLoader = jest.fn().mockResolvedValue({
        ...baseOrderJson,
        id: "order-id",
        source: "artwork_page",
        mode: "offer",
        last_submitted_offer: {
          note: null,
          amount_cents: 100000,
          currency_code: "USD",
        },
        line_items: [{ artwork_id: "artwork-id" }],
      })

      const result = await runAuthenticatedQuery(mockMutation, context)

      expect(result.errors).toBeUndefined()
      expect(context.submitArtworkInquiryRequestLoader).toHaveBeenCalledWith({
        artwork: "artwork-id",
        message: "I sent an offer for US$1,000",
        order_id: "order-id",
      })
    })

    it("creates an inquiry with default message when note is empty string", async () => {
      context.meOrderSubmitLoader = jest.fn().mockResolvedValue({
        ...baseOrderJson,
        id: "order-id",
        source: "artwork_page",
        mode: "offer",
        last_submitted_offer: {
          note: "",
          amount_cents: 50000,
          currency_code: "EUR",
        },
        line_items: [{ artwork_id: "artwork-id" }],
      })

      const result = await runAuthenticatedQuery(mockMutation, context)

      expect(result.errors).toBeUndefined()
      expect(context.submitArtworkInquiryRequestLoader).toHaveBeenCalledWith({
        artwork: "artwork-id",
        message: "I sent an offer for €500",
        order_id: "order-id",
      })
    })

    it("creates an inquiry with default message when note is whitespace only", async () => {
      context.meOrderSubmitLoader = jest.fn().mockResolvedValue({
        ...baseOrderJson,
        id: "order-id",
        source: "artwork_page",
        mode: "offer",
        last_submitted_offer: {
          note: "   ",
          amount_cents: 75000,
          currency_code: "GBP",
        },
        line_items: [{ artwork_id: "artwork-id" }],
      })

      const result = await runAuthenticatedQuery(mockMutation, context)

      expect(result.errors).toBeUndefined()
      expect(context.submitArtworkInquiryRequestLoader).toHaveBeenCalledWith({
        artwork: "artwork-id",
        message: "I sent an offer for £750",
        order_id: "order-id",
      })
    })

    it("does not create inquiry for buy orders", async () => {
      context.meOrderSubmitLoader = jest.fn().mockResolvedValue({
        ...baseOrderJson,
        id: "order-id",
        source: "artwork_page",
        mode: "buy",
        line_items: [{ artwork_id: "artwork-id" }],
      })

      const result = await runAuthenticatedQuery(mockMutation, context)

      expect(result.errors).toBeUndefined()
      expect(context.submitArtworkInquiryRequestLoader).not.toHaveBeenCalled()
    })

    it("does not create inquiry for offer orders from inquiry source", async () => {
      context.meOrderSubmitLoader = jest.fn().mockResolvedValue({
        ...baseOrderJson,
        id: "order-id",
        source: "inquiry",
        mode: "OFFER",
        last_submitted_offer: {
          note: null,
          amount_cents: 100000,
          currency_code: "USD",
        },
        line_items: [{ artwork_id: "artwork-id" }],
      })

      const result = await runAuthenticatedQuery(mockMutation, context)

      expect(result.errors).toBeUndefined()
      expect(context.submitArtworkInquiryRequestLoader).not.toHaveBeenCalled()
    })

    it("does not create inquiry for offer orders in IN_REVIEW state", async () => {
      context.meOrderSubmitLoader = jest.fn().mockResolvedValue({
        ...baseOrderJson,
        id: "order-id",
        source: "artwork_page",
        mode: "offer",
        state: "IN_REVIEW",
        payment_method: "WIRE_TRANSFER",
        last_submitted_offer: {
          note: "I would like to purchase this artwork",
          amount_cents: 100000,
          currency_code: "USD",
        },
        line_items: [{ artwork_id: "artwork-id" }],
      })

      const result = await runAuthenticatedQuery(mockMutation, context)

      expect(result.errors).toBeUndefined()
      expect(context.submitArtworkInquiryRequestLoader).not.toHaveBeenCalled()
    })

    it("handles inquiry creation failure gracefully", async () => {
      const consoleErrorSpy = jest.spyOn(console, "error").mockImplementation()

      context.meOrderSubmitLoader = jest.fn().mockResolvedValue({
        ...baseOrderJson,
        id: "order-id",
        source: "artwork_page",
        mode: "offer",
        last_submitted_offer: {
          note: null,
          amount_cents: 100000,
          currency_code: "USD",
        },
        line_items: [{ artwork_id: "artwork-id" }],
      })
      context.submitArtworkInquiryRequestLoader = jest
        .fn()
        .mockRejectedValue(new Error("Gravity API error"))

      const result = await runAuthenticatedQuery(mockMutation, context)

      // Order should still succeed even if inquiry creation fails
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

      // Error should be logged but not thrown
      expect(consoleErrorSpy).toHaveBeenCalledWith(
        "[submitOrderMutation] Failed to create inquiry for offer order:",
        expect.any(Error)
      )

      consoleErrorSpy.mockRestore()
    })
  })
})
