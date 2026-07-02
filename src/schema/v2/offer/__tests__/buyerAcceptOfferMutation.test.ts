import { runAuthenticatedQuery } from "schema/v2/test/utils"
import { baseOrderJson } from "../../order/__tests__/support"

const mockMutation = `
  mutation {
    buyerAcceptOffer(input: {
      orderID: "order-id",
      offerID: "offer-id"
    }) {
      orderOrError {
        ...on OrderMutationError {
          mutationError {
            message
            code
          }
        }
        ...on OrderMutationActionRequired {
          actionData {
            clientSecret
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

describe("buyerAcceptOfferMutation", () => {
  beforeEach(() => {
    context = {
      meOfferAcceptLoader: jest.fn().mockResolvedValue({
        ...baseOrderJson,
        id: "order-id",
        mode: "offer",
      }),
    }
  })

  it("accepts a seller's offer and returns the order", async () => {
    const result = await runAuthenticatedQuery(mockMutation, context)

    expect(result.errors).toBeUndefined()
    expect(result).toEqual({
      buyerAcceptOffer: {
        orderOrError: {
          order: {
            internalID: "order-id",
          },
        },
      },
    })

    expect(context.meOfferAcceptLoader).toHaveBeenCalledWith({
      orderID: "order-id",
      offerID: "offer-id",
    })
  })

  it("returns a 422 exchange error", async () => {
    context.meOfferAcceptLoader = jest.fn().mockRejectedValue({
      statusCode: 422,
      body: {
        message: "offer_total_not_defined",
        code: "offer_total_not_defined",
      },
    })

    const result = await runAuthenticatedQuery(mockMutation, context)

    expect(result.errors).toBeUndefined()
    expect(result).toEqual({
      buyerAcceptOffer: {
        orderOrError: {
          mutationError: {
            message: "offer_total_not_defined",
            code: "offer_total_not_defined",
          },
        },
      },
    })
  })

  it("returns an action-required response when payment requires action", async () => {
    context.meOfferAcceptLoader = jest.fn().mockRejectedValue({
      statusCode: 422,
      body: {
        code: "payment_requires_action",
        action_data: { client_secret: "cs_1" },
      },
    })

    const result = await runAuthenticatedQuery(mockMutation, context)

    expect(result.errors).toBeUndefined()
    expect(result).toEqual({
      buyerAcceptOffer: {
        orderOrError: {
          actionData: {
            clientSecret: "cs_1",
          },
        },
      },
    })
  })

  it("returns a generic error when the loader fails", async () => {
    const result = await runAuthenticatedQuery(mockMutation, {})

    expect(result.errors).toBeUndefined()
    expect(result).toEqual({
      buyerAcceptOffer: {
        orderOrError: {
          mutationError: {
            message: "An error occurred",
            code: "internal_error",
          },
        },
      },
    })
  })
})
