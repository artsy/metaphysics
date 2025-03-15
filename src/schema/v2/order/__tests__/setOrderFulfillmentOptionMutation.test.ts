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
        ... on SetOrderFulfillmentOptionSuccess {
          order {
            id
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
        ... on SetOrderFulfillmentOptionError {
          mutationError {
            message
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
            type: "DOMESTIC_FLAT",
            amount_cents: 2000,
            currency_code: "USD",
            selected: true,
          },
          {
            type: "PICKUP",
            amount_cents: 0,
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

    console.log("Test result:", JSON.stringify(result, null, 2))

    expect(result.errors).toBeUndefined()
    expect(result).toEqual({
      setOrderFulfillmentOption: {
        orderOrError: {
          order: {
            id: "order-id",
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
                amount: {
                  minor: 0,
                  currencyCode: "USD",
                },
                selected: false,
              },
            ],
          },
        },
      },
    })

    expect(context.meOrderSetFulfillmentOptionLoader).toHaveBeenCalledWith(
      "order-id",
      {
        type: "DOMESTIC_FLAT",
      }
    )
  })

  it("propagates an error", async () => {
    context.meOrderSetFulfillmentOptionLoader = jest
      .fn()
      .mockRejectedValue(new Error("Oops - Error updating order"))
    const result = await runAuthenticatedQuery(mockMutation, context)

    console.log("Test result:", JSON.stringify(result, null, 2))

    expect(result.errors).toBeUndefined()
    expect(result).toEqual({
      setOrderFulfillmentOption: {
        orderOrError: {
          mutationError: {
            message: "Oops - Error updating order",
          },
        },
      },
    })
  })
})
