import { runAuthenticatedQuery } from "schema/v2/test/utils"
import { baseOrderJson } from "./support"

const mockMutation = `
  mutation {
    addInitialOfferToOrder(input: {
      orderId: "order-id",
      offerPrice: { amount: 850, currencyCode: "USD" },
      note: "My initial offer"
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
describe("addInitialOfferToOrderMutation", () => {
  beforeEach(() => {
    context = {
      meOrderAddInitialOfferLoader: jest.fn().mockResolvedValue({
        ...baseOrderJson,
        id: "order-id",
        source: "artwork_page",
        code: "order-code",
        mode: "offer",
        state: "pending",
        currency_code: "USD",
        state_reason: null,
        state_updated_at: "2018-10-19T12:00:00.000Z",
        last_offer: {
          id: "offer-id",
          amount_cents: 85000,
          note: "My initial offer",
        },
      }),
    }
  })

  it("adds an initial offer to an order", async () => {
    const query = mockMutation
    const result = await runAuthenticatedQuery(query, context)

    expect(result.errors).toBeUndefined()
    expect(result).toEqual({
      addInitialOfferToOrder: {
        orderOrError: {
          order: {
            internalID: "order-id",
          },
        },
      },
    })

    expect(context.meOrderAddInitialOfferLoader).toHaveBeenCalledWith(
      "order-id",
      {
        amount_cents: 85000,
        note: "My initial offer",
      }
    )
  })

  it("returns an error when the loader fails", async () => {
    context.meOrderAddInitialOfferLoader = jest.fn().mockRejectedValue({
      statusCode: 422,
      body: {
        message: "cannot_offer",
        code: "cannot_offer",
      },
    })

    const query = mockMutation
    const result = await runAuthenticatedQuery(query, context)

    expect(result.errors).toBeUndefined()
    expect(result).toEqual({
      addInitialOfferToOrder: {
        orderOrError: {
          mutationError: {
            message: "cannot_offer",
            code: "cannot_offer",
          },
        },
      },
    })
  })

  it("requires authentication", async () => {
    const query = mockMutation
    const result = await runAuthenticatedQuery(query, {})

    expect(result.errors).toBeUndefined()
    expect(result).toEqual({
      addInitialOfferToOrder: {
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
