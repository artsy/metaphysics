import { runAuthenticatedQuery } from "schema/v2/test/utils"
import { baseArtwork, baseOrderJson } from "./support"

let context

describe("setOrderPaymentMutation", () => {
  beforeEach(() => {
    context = {
      meOrderSetPaymentLoader: jest.fn().mockResolvedValue({
        ...baseOrderJson,
        id: "order-id",
        source: "artwork_page",
        code: "order-code",
        mode: "buy",
        currency_code: "USD",
      }),
      artworkLoader: jest.fn().mockResolvedValue({ ...baseArtwork }),
      artworkVersionLoader: jest
        .fn()
        .mockResolvedValue({ ...baseArtwork, id: "artwork-version-id" }),
    }
  })

  describe("with credit card", () => {
    it("sets payment with credit card id", async () => {
      context.meOrderSetPaymentLoader = jest.fn().mockResolvedValue({
        ...baseOrderJson,
        id: "order-id",
        payment_method: "credit card",
        credit_card_id: "cc-123",
      })

      const mutation = `
        mutation {
          setOrderPayment(input: {
            id: "order-id",
            paymentMethod: CREDIT_CARD,
            paymentMethodId: "cc-123"
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

      const result = await runAuthenticatedQuery(mutation, context)

      expect(result.errors).toBeUndefined()
      expect(result).toEqual({
        setOrderPayment: {
          orderOrError: {
            order: {
              internalID: "order-id",
            },
          },
        },
      })

      expect(context.meOrderSetPaymentLoader).toHaveBeenCalledWith("order-id", {
        payment_method: "credit card",
        payment_method_id: "cc-123",
      })
    })

    it("sets payment with wallet type and confirmation token", async () => {
      context.meOrderSetPaymentLoader = jest.fn().mockResolvedValue({
        ...baseOrderJson,
        id: "order-id",
        payment_method: "credit card",
        credit_card_wallet_type: "apple_pay",
        stripe_confirmation_token: "ctoken_123",
      })

      const mutation = `
        mutation {
          setOrderPayment(input: {
            id: "order-id",
            paymentMethod: CREDIT_CARD,
            creditCardWalletType: APPLE_PAY,
            stripeConfirmationToken: "ctoken_123"
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

      const result = await runAuthenticatedQuery(mutation, context)

      expect(result.errors).toBeUndefined()
      expect(context.meOrderSetPaymentLoader).toHaveBeenCalledWith("order-id", {
        payment_method: "credit card",
        credit_card_wallet_type: "apple_pay",
        stripe_confirmation_token: "ctoken_123",
      })
    })

    it("sets payment with only confirmation token", async () => {
      context.meOrderSetPaymentLoader = jest.fn().mockResolvedValue({
        ...baseOrderJson,
        id: "order-id",
        payment_method: "credit card",
        stripe_confirmation_token: "ctoken_456",
      })

      const mutation = `
        mutation {
          setOrderPayment(input: {
            id: "order-id",
            paymentMethod: CREDIT_CARD,
            stripeConfirmationToken: "ctoken_456"
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

      const result = await runAuthenticatedQuery(mutation, context)

      expect(result.errors).toBeUndefined()
      expect(context.meOrderSetPaymentLoader).toHaveBeenCalledWith("order-id", {
        payment_method: "credit card",
        stripe_confirmation_token: "ctoken_456",
      })
    })

    it("sets payment with Google Pay wallet type", async () => {
      context.meOrderSetPaymentLoader = jest.fn().mockResolvedValue({
        ...baseOrderJson,
        id: "order-id",
        payment_method: "credit card",
        credit_card_wallet_type: "google_pay",
        stripe_confirmation_token: "ctoken_789",
      })

      const mutation = `
        mutation {
          setOrderPayment(input: {
            id: "order-id",
            paymentMethod: CREDIT_CARD,
            creditCardWalletType: GOOGLE_PAY,
            stripeConfirmationToken: "ctoken_789"
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

      const result = await runAuthenticatedQuery(mutation, context)

      expect(result.errors).toBeUndefined()
      expect(context.meOrderSetPaymentLoader).toHaveBeenCalledWith("order-id", {
        payment_method: "credit card",
        credit_card_wallet_type: "google_pay",
        stripe_confirmation_token: "ctoken_789",
      })
    })
  })

  describe("with bank account", () => {
    it("sets payment with US bank account", async () => {
      context.meOrderSetPaymentLoader = jest.fn().mockResolvedValue({
        ...baseOrderJson,
        id: "order-id",
        payment_method: "us_bank_account",
        bank_account_id: "ba-456",
      })

      const mutation = `
        mutation {
          setOrderPayment(input: {
            id: "order-id",
            paymentMethod: US_BANK_ACCOUNT,
            paymentMethodId: "ba-456"
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

      const result = await runAuthenticatedQuery(mutation, context)

      expect(result.errors).toBeUndefined()
      expect(context.meOrderSetPaymentLoader).toHaveBeenCalledWith("order-id", {
        payment_method: "us_bank_account",
        payment_method_id: "ba-456",
      })
    })

    it("sets payment with SEPA debit", async () => {
      context.meOrderSetPaymentLoader = jest.fn().mockResolvedValue({
        ...baseOrderJson,
        id: "order-id",
        payment_method: "sepa_debit",
        bank_account_id: "ba-sepa-789",
      })

      const mutation = `
        mutation {
          setOrderPayment(input: {
            id: "order-id",
            paymentMethod: SEPA_DEBIT,
            paymentMethodId: "ba-sepa-789"
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

      const result = await runAuthenticatedQuery(mutation, context)

      expect(result.errors).toBeUndefined()
      expect(context.meOrderSetPaymentLoader).toHaveBeenCalledWith("order-id", {
        payment_method: "sepa_debit",
        payment_method_id: "ba-sepa-789",
      })
    })
  })

  describe("with wire transfer", () => {
    it("sets payment with wire transfer (no payment method id required)", async () => {
      context.meOrderSetPaymentLoader = jest.fn().mockResolvedValue({
        ...baseOrderJson,
        id: "order-id",
        payment_method: "wire_transfer",
      })

      const mutation = `
        mutation {
          setOrderPayment(input: {
            id: "order-id",
            paymentMethod: WIRE_TRANSFER
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

      const result = await runAuthenticatedQuery(mutation, context)

      expect(result.errors).toBeUndefined()
      expect(context.meOrderSetPaymentLoader).toHaveBeenCalledWith("order-id", {
        payment_method: "wire_transfer",
      })
    })
  })

  describe("error handling", () => {
    it("propagates a generic error", async () => {
      context.meOrderSetPaymentLoader = jest
        .fn()
        .mockRejectedValue(new Error("Oops - Error setting payment"))

      const mutation = `
        mutation {
          setOrderPayment(input: {
            id: "order-id",
            paymentMethod: CREDIT_CARD,
            paymentMethodId: "cc-123"
          }) {
            orderOrError {
              ...on OrderMutationError {
                mutationError {
                  message
                  code
                }
              }
            }
          }
        }
      `

      const result = await runAuthenticatedQuery(mutation, context)

      expect(result.errors).toBeUndefined()
      expect(result).toEqual({
        setOrderPayment: {
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
      context.meOrderSetPaymentLoader = jest.fn().mockRejectedValue({
        statusCode: 422,
        body: {
          message: "payment_method_requires_identifier",
          code: "payment_method_requires_identifier",
        },
      })

      const mutation = `
        mutation {
          setOrderPayment(input: {
            id: "order-id",
            paymentMethod: CREDIT_CARD
          }) {
            orderOrError {
              ...on OrderMutationError {
                mutationError {
                  message
                  code
                }
              }
            }
          }
        }
      `

      const result = await runAuthenticatedQuery(mutation, context)

      expect(result.errors).toBeUndefined()
      expect(result).toEqual({
        setOrderPayment: {
          orderOrError: {
            mutationError: {
              message: "payment_method_requires_identifier",
              code: "payment_method_requires_identifier",
            },
          },
        },
      })
    })

    it("propagates order not pending error", async () => {
      context.meOrderSetPaymentLoader = jest.fn().mockRejectedValue({
        statusCode: 422,
        body: {
          message: "order_not_pending: submitted",
          code: "order_not_pending",
        },
      })

      const mutation = `
        mutation {
          setOrderPayment(input: {
            id: "order-id",
            paymentMethod: CREDIT_CARD,
            paymentMethodId: "cc-123"
          }) {
            orderOrError {
              ...on OrderMutationError {
                mutationError {
                  message
                  code
                }
              }
            }
          }
        }
      `

      const result = await runAuthenticatedQuery(mutation, context)

      expect(result.errors).toBeUndefined()
      expect(result).toEqual({
        setOrderPayment: {
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

  describe("authentication", () => {
    it("requires authentication", async () => {
      const mutation = `
        mutation {
          setOrderPayment(input: {
            id: "order-id",
            paymentMethod: CREDIT_CARD,
            paymentMethodId: "cc-123"
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

      await expect(
        runAuthenticatedQuery(mutation, {
          ...context,
          meOrderSetPaymentLoader: undefined,
        })
      ).rejects.toThrow("You need to be signed in to perform this action")
    })
  })
})
