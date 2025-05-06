import { ORDER_MUTATION_FLAGS } from "./sharedTypes/sharedOrderTypes"

type ExchangeError = Error & {
  statusCode: number
  body?: {
    message: string
    code: string
  }
}
export const handleExchangeError = (error: ExchangeError) => {
  let errorProperties: { message: string; code: string }

  if (error.statusCode === 422 && typeof error.body === "object") {
    errorProperties = {
      message: error.body.message,
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
  }
}
