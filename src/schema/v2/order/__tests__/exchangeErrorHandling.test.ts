import { handleExchangeError } from "../exchangeErrorHandling"
import { ORDER_MUTATION_FLAGS } from "../types/sharedOrderTypes"

describe("handleExchangeError", () => {
  const createError = (
    statusCode: number,
    body?: {
      message?: string
      code: string
      action_data?: { client_secret: string }
    }
  ) => {
    const error = new Error("Test error") as Error & {
      statusCode: number
      body?: typeof body
    }
    error.statusCode = statusCode
    error.body = body
    return error
  }

  describe("when error requires payment action", () => {
    it("returns ACTION_REQUIRED with clientSecret when payment_requires_action", () => {
      const error = createError(422, {
        code: "payment_requires_action",
        action_data: { client_secret: "secret_123" },
      })

      const result = handleExchangeError(error)

      expect(result).toEqual({
        clientSecret: "secret_123",
        _type: ORDER_MUTATION_FLAGS.ACTION_REQUIRED,
        __typename: "OrderMutationActionRequired",
      })
    })

    it("returns ACTION_REQUIRED with undefined clientSecret when action_data is missing", () => {
      const error = createError(422, {
        code: "payment_requires_action",
      })

      const result = handleExchangeError(error)

      expect(result).toEqual({
        clientSecret: undefined,
        _type: ORDER_MUTATION_FLAGS.ACTION_REQUIRED,
        __typename: "OrderMutationActionRequired",
      })
    })
  })

  describe("when error is 422 with object body", () => {
    it("returns error with message and code from body", () => {
      const error = createError(422, {
        message: "Insufficient funds",
        code: "insufficient_funds",
      })

      const result = handleExchangeError(error)

      expect(result).toEqual({
        message: "Insufficient funds",
        code: "insufficient_funds",
        _type: ORDER_MUTATION_FLAGS.ERROR,
        __typename: "OrderMutationError",
      })
    })

    it("returns default message when body message is missing", () => {
      const error = createError(422, {
        code: "some_error",
      })

      const result = handleExchangeError(error)

      expect(result).toEqual({
        message: "An error occurred",
        code: "some_error",
        _type: ORDER_MUTATION_FLAGS.ERROR,
        __typename: "OrderMutationError",
      })
    })
  })

  describe("when error is not 422 or body is not an object", () => {
    it("returns internal error for non-422 status code", () => {
      const error = createError(500, {
        message: "Server error",
        code: "server_error",
      })

      const result = handleExchangeError(error)

      expect(result).toEqual({
        message: "An error occurred",
        code: "internal_error",
        _type: ORDER_MUTATION_FLAGS.ERROR,
        __typename: "OrderMutationError",
      })
    })

    it("returns internal error when body is undefined", () => {
      const error = createError(422)

      const result = handleExchangeError(error)

      expect(result).toEqual({
        message: "An error occurred",
        code: "internal_error",
        _type: ORDER_MUTATION_FLAGS.ERROR,
        __typename: "OrderMutationError",
      })
    })
  })
})
