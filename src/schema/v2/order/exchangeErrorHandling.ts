import { safeJsonParse } from "lib/jsonParse"
import { ORDER_MUTATION_FLAGS } from "./types/sharedOrderTypes"

type ExchangeError = Error & {
  statusCode: number
  body?: {
    message?: string
    code: string
    action_data?: {
      client_secret: string
    }
  }
}

type ExchangeErrorBody = ExchangeError["body"]

export const handleExchangeError = (error: ExchangeError) => {
  const errorBody = safeJsonParse<ExchangeErrorBody>(error.body) || error.body

  if (
    error.statusCode === 422 &&
    errorBody?.code === "payment_requires_action"
  ) {
    return {
      clientSecret: errorBody?.action_data?.client_secret,
      _type: ORDER_MUTATION_FLAGS.ACTION_REQUIRED,
      __typename: "OrderMutationActionRequired",
    }
  }

  if (error.statusCode === 422) {
    return {
      message: errorBody?.message || "An error occurred",
      code: errorBody?.code,
      _type: ORDER_MUTATION_FLAGS.ERROR,
      __typename: "OrderMutationError",
    }
  }

  return {
    message: "An error occurred",
    code: "internal_error",
    _type: ORDER_MUTATION_FLAGS.ERROR,
    __typename: "OrderMutationError",
  }
}
