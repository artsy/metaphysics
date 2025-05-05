import { runAuthenticatedQuery } from "schema/v2/test/utils"
import { baseArtwork, baseOrderJson } from "./support"

const mockMutation = `
  mutation {
    updateOrderShippingAddress(input: {
      id: "order-id",
      buyerPhoneNumber: "123-456-7890",
      buyerPhoneNumberCountryCode: "+1",
      shippingName: "John Doe",
      shippingAddressLine1: "123 Main St",
      shippingAddressLine2: "Apt 4B",
      shippingCity: "New York",
      shippingRegion: "NY",
      shippingCountry: "US",
      shippingPostalCode: "10001"
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
            fulfillmentDetails {
              phoneNumber {
                display(format: E164)
                countryCode
                regionCode
              }
              phoneNumberCountryCode
              name
              addressLine1
              addressLine2
              city
              region
              country
              postalCode
            }
          }
        }
      }
    }
  }
`

let context
describe("updateOrderShippingAddressMutation", () => {
  beforeEach(() => {
    context = {
      meOrderUpdateShippingAddressLoader: jest.fn().mockResolvedValue({
        ...baseOrderJson,
        id: "order-id",
        source: "artwork_page",
        code: "order-code",
        mode: "buy",
        currency_code: "USD",
        buyer_total_cents: null,
        items_total_cents: 500000,
        shipping_total_cents: 2000,
        buyer_phone_number: "123-456-7890",
        buyer_phone_number_country_code: "US",
        shipping_name: "John Doe",
        shipping_country: "US",
        shipping_postal_code: "10001",
        shipping_region: "NY",
        shipping_city: "New York",
        shipping_address_line1: "123 Main St",
        shipping_address_line2: "Apt 4B",
      }),
      artworkLoader: jest.fn().mockResolvedValue({ ...baseArtwork }),
      artworkVersionLoader: jest
        .fn()
        .mockResolvedValue({ ...baseArtwork, id: "artwork-version-id" }),
    }
  })
  it("should update an order with all fields", async () => {
    const result = await runAuthenticatedQuery(mockMutation, context)

    expect(result.errors).toBeUndefined()
    expect(result).toEqual({
      updateOrderShippingAddress: {
        orderOrError: {
          order: {
            internalID: "order-id",
            fulfillmentDetails: {
              phoneNumber: {
                display: "+11234567890",
                countryCode: "1",
                regionCode: "us",
              },
              phoneNumberCountryCode: "US",
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

    expect(context.meOrderUpdateShippingAddressLoader).toHaveBeenCalledWith(
      "order-id",
      {
        buyer_phone_number: "123-456-7890",
        buyer_phone_number_country_code: "+1",
        shipping_address_line1: "123 Main St",
        shipping_address_line2: "Apt 4B",
        shipping_city: "New York",
        shipping_country: "US",
        shipping_name: "John Doe",
        shipping_postal_code: "10001",
        shipping_region: "NY",
      }
    )
  })

  it("only sends the fields that are provided (including Null", async () => {
    const result = await runAuthenticatedQuery(
      `
      mutation {
        updateOrderShippingAddress(input: {
          id: "order-id",
          buyerPhoneNumber: null
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
    `,
      context
    )

    expect(result.updateOrderShippingAddress.orderOrError.order).toBeDefined()
    expect(result).toEqual({
      updateOrderShippingAddress: {
        orderOrError: {
          order: {
            internalID: "order-id",
          },
        },
      },
    })

    expect(context.meOrderUpdateShippingAddressLoader).toHaveBeenCalledWith(
      "order-id",
      {
        buyer_phone_number: null,
      }
    )
  })

  it("propagates an error", async () => {
    context.meOrderUpdateShippingAddressLoader = jest
      .fn()
      .mockRejectedValue(new Error("Oops - Error updating order"))
    const result = await runAuthenticatedQuery(mockMutation, context)

    expect(result.errors).toBeUndefined()
    expect(result).toEqual({
      updateOrderShippingAddress: {
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
    context.meOrderUpdateShippingAddressLoader = jest.fn().mockRejectedValue({
      statusCode: 422,
      body: {
        message: "order_not_pending: submitted",
        code: "order_not_pending",
      },
    })
    const result = await runAuthenticatedQuery(mockMutation, context)

    expect(result.errors).toBeUndefined()
    expect(result).toEqual({
      updateOrderShippingAddress: {
        orderOrError: {
          mutationError: {
            message: "order_not_pending: submitted",
            code: "order_not_pending",
          },
        },
      },
    })
  })
})
