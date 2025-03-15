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
      artworkLoader: jest.fn().mockResolvedValue({ ...baseArtwork }),
      artworkVersionLoader: jest
        .fn()
        .mockResolvedValue({ ...baseArtwork, id: "artwork-version-id" }),
    }
  })
  it.only("should update fulfillment option", async () => {
    const result = await runAuthenticatedQuery(mockMutation, context)

    expect(result.errors).toBeUndefined()
    expect(result).toEqual({
      setOrderFulfillmentOption: {
        orderOrError: {
          order: {
            internalID: "order-id",
            fulfillmentDetails: {
              phoneNumber: "123-456-7890",
              phoneNumberCountryCode: "+1",
              name: "John Doe",
              addressLine1: "123 Main St",
              addressLine2: "Apt 4B",
              city: "New York",
              region: "NY",
              country: "US",
              postalCode: "10001",
            },
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
