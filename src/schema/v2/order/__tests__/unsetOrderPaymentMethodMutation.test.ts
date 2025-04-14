import { baseArtwork, baseOrderJson } from "./support"
import { runAuthenticatedQuery } from "schema/v2/test/utils"

const mockMutation = `
  mutation {
    unsetOrderPaymentMethod(input: { id: "order-id" }) {
      orderOrError {
        ... on OrderMutationSuccess {
          order {
            internalID
          }
        }
        ... on OrderMutationError {
          mutationError {
            message
            code
          }
        }
      }
    }
  }
`

describe("unsetOrderPaymentMethod", () => {
  const context = {
    meOrderUnsetPaymentMethodLoader: jest.fn().mockResolvedValue({
      ...baseOrderJson,
      id: "order-id",
    }),
    artworkLoader: jest
      .fn()
      .mockResolvedValue({ ...baseArtwork, id: "artwork-id" }),
    artworkVersionLoader: jest
      .fn()
      .mockResolvedValue({ ...baseArtwork, id: "artwork-version-id" }),
  }

  it("should unset the payment method", async () => {
    const result = await runAuthenticatedQuery(mockMutation, context)

    expect(context.meOrderUnsetPaymentMethodLoader).toHaveBeenCalledWith(
      "order-id"
    )
    expect(result.errors).toBeUndefined()
    expect(result).toEqual({
      unsetOrderPaymentMethod: {
        orderOrError: {
          order: {
            internalID: "order-id",
          },
        },
      },
    })
  })

  it("should handle 422 error from exchange", async () => {
    context.meOrderUnsetPaymentMethodLoader = jest.fn().mockRejectedValue({
      statusCode: 422,
      body: {
        message: "order_not_pending - submitted",
        code: "order_not_pending",
      },
    })

    const result = await runAuthenticatedQuery(mockMutation, context)

    expect(result.errors).toBeUndefined()
    expect(result).toEqual({
      unsetOrderPaymentMethod: {
        orderOrError: {
          mutationError: {
            message: "order_not_pending - submitted",
            code: "order_not_pending",
          },
        },
      },
    })
  })

  it("should handle errors", async () => {
    context.meOrderUnsetPaymentMethodLoader = jest.fn().mockRejectedValue({
      message: "An error occurred",
      statusCode: 500,
    })

    const result = await runAuthenticatedQuery(mockMutation, context)

    expect(result.errors).toBeUndefined()
    expect(result).toEqual({
      unsetOrderPaymentMethod: {
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
