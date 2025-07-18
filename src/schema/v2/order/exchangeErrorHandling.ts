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

export const handleExchangeError = (error: ExchangeError) => {
  let errorProperties: { message: string; code: string }

  if (
    error.statusCode === 422 &&
    error.body?.code === "payment_requires_action"
  ) {
    return {
      clientSecret: error.body.action_data?.client_secret,
      _type: ORDER_MUTATION_FLAGS.ACTION_REQUIRED,
      __typename: "OrderMutationActionRequired",
    }
  }

  if (error.statusCode === 422 && typeof error.body === "object") {
    errorProperties = {
      message: error.body.message || "An error occurred",
      code: error.body.code,
    }
  } else {
    errorProperties = {
      message: "An error occurred",
      code: "internal_error",
    }
  }

  return {
    ...errorProperties,
    _type: ORDER_MUTATION_FLAGS.ERROR,
    __typename: "OrderMutationError",
  }
}
