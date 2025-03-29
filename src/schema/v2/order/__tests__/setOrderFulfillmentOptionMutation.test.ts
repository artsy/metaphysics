import { runAuthenticatedQuery } from "schema/v2/test/utils"
import { baseArtwork, baseOrderJson } from "./support"

const mockMutation = `
  mutation {
    setOrderFulfillmentOption(input: {
      id: "order-id",
      fulfillmentOption: {
        type: DOMESTIC_FLAT
      }
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
describe("setOrderFulfillmentOption", () => {
  beforeEach(() => {
    context = {
      meOrderSetFulfillmentOptionLoader: jest.fn().mockResolvedValue({
        ...baseOrderJson,
        id: "order-id", // Ensure the id field is present
        fulfillment_options: [
          {
            type: "domestic_flat",
            amount_minor: 2000,
            currency_code: "USD",
            selected: true,
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
      setOrderFulfillmentOption: {
        orderOrError: {
          order: {
            internalID: "order-id",
            fulfillmentOptions: [
              {
                type: "DOMESTIC_FLAT",
                amount: {
                  minor: 2000,
                  currencyCode: "USD",
                },
                selected: true,
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

    expect(context.meOrderSetFulfillmentOptionLoader).toHaveBeenCalledWith(
      "order-id",
      {
        type: "domestic_flat",
      }
    )
  })

  it("propagates an unknown error", async () => {
    context.meOrderSetFulfillmentOptionLoader = jest.fn().mockRejectedValue({
      message: "An error occurred",
      statusCode: 500,
    })
    const result = await runAuthenticatedQuery(mockMutation, context)

    expect(result.errors).toBeUndefined()
    expect(result).toEqual({
      setOrderFulfillmentOption: {
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
    context.meOrderSetFulfillmentOptionLoader = jest.fn().mockRejectedValue({
      statusCode: 422,
      body: {
        message: "Invalid fulfillment option: rocket_ship",
        code: "invalid_fulfillment_option",
      },
    })
    const result = await runAuthenticatedQuery(mockMutation, context)

    expect(result.errors).toBeUndefined()
    expect(result).toEqual({
      setOrderFulfillmentOption: {
        orderOrError: {
          mutationError: {
            message: "Invalid fulfillment option: rocket_ship",
            code: "invalid_fulfillment_option",
          },
        },
      },
    })
  })
})
