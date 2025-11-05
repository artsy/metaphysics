import { OFFER_MUTATION_FLAGS } from "../order/types/sharedOfferTypes"

type ExchangeError = Error & {
  statusCode: number
  body?: {
    message?: string
    code: string
  }
}

export const handleOfferExchangeError = (error: ExchangeError) => {
  let errorProperties: { message: string; code: string }

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
    _type: OFFER_MUTATION_FLAGS.ERROR,
    __typename: "OfferMutationError",
  }
}
