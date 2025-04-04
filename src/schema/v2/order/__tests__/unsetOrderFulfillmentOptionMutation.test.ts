import { runAuthenticatedQuery } from "schema/v2/test/utils"
import { baseArtwork, baseOrderJson } from "./support"

const mockMutation = `
  mutation {
    unsetOrderFulfillmentOption(input: {
      id: "order-id",
    }) {
      orderOrError {
        ... on OrderMutationSuccess {
          order {
            internalID
            fulfillmentOptions {
              type
              amount {
                minor
                currencyCode
              }
              selected
            }
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

let context
describe("unsetOrderFulfillmentOption", () => {
  beforeEach(() => {
    context = {
      meOrderUnsetFulfillmentOptionLoader: jest.fn().mockResolvedValue({
        ...baseOrderJson,
        id: "order-id", // Ensure the id field is present
        fulfillment_options: [
          {
            type: "domestic_flat",
            amount_minor: 2000,
            currency_code: "USD",
          },
          {
            type: "pickup",
            amount_minor: null,
            currency_code: "USD",
          },
        ],
      }),
      artworkLoader: jest
        .fn()
        .mockResolvedValue({ ...baseArtwork, id: "artwork-id" }),
      artworkVersionLoader: jest
        .fn()
        .mockResolvedValue({ ...baseArtwork, id: "artwork-version-id" }),
    }
  })

  it("should update fulfillment option", async () => {
    const result = await runAuthenticatedQuery(mockMutation, context)

    expect(result.errors).toBeUndefined()
    expect(result).toEqual({
      unsetOrderFulfillmentOption: {
        orderOrError: {
          order: {
            internalID: "order-id",
            fulfillmentOptions: [
              {
                type: "DOMESTIC_FLAT",
                selected: null,
                amount: {
                  minor: 2000,
                  currencyCode: "USD",
                },
              },
              {
                type: "PICKUP",
                amount: null,
                selected: null,
              },
            ],
          },
        },
      },
    })

    expect(context.meOrderUnsetFulfillmentOptionLoader).toHaveBeenCalledWith(
      "order-id"
    )
  })

  it("propagates an unknown error", async () => {
    context.meOrderUnsetFulfillmentOptionLoader = jest.fn().mockRejectedValue({
      message: "An error occurred",
      statusCode: 500,
    })
    const result = await runAuthenticatedQuery(mockMutation, context)

    expect(result.errors).toBeUndefined()
    expect(result).toEqual({
      unsetOrderFulfillmentOption: {
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
    context.meOrderUnsetFulfillmentOptionLoader = jest.fn().mockRejectedValue({
      statusCode: 422,
      body: {
        message: "order_not_pending - submitted",
        code: "order_not_pending",
      },
    })
    const result = await runAuthenticatedQuery(mockMutation, context)

    expect(result.errors).toBeUndefined()
    expect(result).toEqual({
      unsetOrderFulfillmentOption: {
        orderOrError: {
          mutationError: {
            message: "order_not_pending - submitted",
            code: "order_not_pending",
          },
        },
      },
    })
  })
})
