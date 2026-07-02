import { runAuthenticatedQuery } from "schema/v2/test/utils"
import { baseOrderJson } from "../../order/__tests__/support"

const mockMutation = `
  mutation {
    buyerRejectOffer(input: {
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

describe("buyerRejectOfferMutation", () => {
  beforeEach(() => {
    context = {
      meOfferRejectLoader: jest.fn().mockResolvedValue({
        ...baseOrderJson,
        id: "order-id",
        mode: "offer",
      }),
    }
  })

  it("declines a seller's offer and returns the order", async () => {
    const result = await runAuthenticatedQuery(mockMutation, context)

    expect(result.errors).toBeUndefined()
    expect(result).toEqual({
      buyerRejectOffer: {
        orderOrError: {
          order: {
            internalID: "order-id",
          },
        },
      },
    })

    expect(context.meOfferRejectLoader).toHaveBeenCalledWith(
      { orderID: "order-id", offerID: "offer-id" },
      {}
    )
  })

  it("forwards rejectReason as reject_reason", async () => {
    const mutation = `
      mutation {
        buyerRejectOffer(input: {
          orderID: "order-id",
          offerID: "offer-id",
          rejectReason: "buyer_rejected"
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
    expect(context.meOfferRejectLoader).toHaveBeenCalledWith(
      { orderID: "order-id", offerID: "offer-id" },
      { reject_reason: "buyer_rejected" }
    )
  })

  it("returns a 422 exchange error", async () => {
    context.meOfferRejectLoader = jest.fn().mockRejectedValue({
      statusCode: 422,
      body: {
        message: "cannot_reject_offer",
        code: "cannot_reject_offer",
      },
    })

    const result = await runAuthenticatedQuery(mockMutation, context)

    expect(result.errors).toBeUndefined()
    expect(result).toEqual({
      buyerRejectOffer: {
        orderOrError: {
          mutationError: {
            message: "cannot_reject_offer",
            code: "cannot_reject_offer",
          },
        },
      },
    })
  })

  it("returns a generic error when the loader fails", async () => {
    const result = await runAuthenticatedQuery(mockMutation, {})

    expect(result.errors).toBeUndefined()
    expect(result).toEqual({
      buyerRejectOffer: {
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
