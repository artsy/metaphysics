import { runAuthenticatedQuery } from "schema/v2/test/utils"
import { baseArtwork, baseOrderJson } from "./support"

const mockMutation = `
  mutation {
    updateOrder(input: {
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
        ...on UpdateOrderError {
          mutationError {
            message
          }
        }
        ...on UpdateOrderSuccess {
          order {
            internalID
            fulfillmentDetails {
              phoneNumber
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
describe("updateOrderMutation", () => {
  beforeEach(() => {
    context = {
      meOrderUpdateLoader: jest.fn().mockResolvedValue({
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
        buyer_phone_number_country_code: "+1",
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
      updateOrder: {
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

    expect(context.meOrderUpdateLoader).toHaveBeenCalledWith("order-id", {
      buyer_phone_number: "123-456-7890",
      buyer_phone_number_country_code: "+1",
      shipping_address_line1: "123 Main St",
      shipping_address_line2: "Apt 4B",
      shipping_city: "New York",
      shipping_country: "US",
      shipping_name: "John Doe",
      shipping_postal_code: "10001",
      shipping_region: "NY",
    })
  })

  it("only sends the fields that are provided (including Null", async () => {
    const result = await runAuthenticatedQuery(
      `
      mutation {
        updateOrder(input: {
          id: "order-id",
          buyerPhoneNumber: null
        }) {
          orderOrError {
            ...on UpdateOrderSuccess {
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

    expect(result.updateOrder.orderOrError.order).toBeDefined()
    expect(result).toEqual({
      updateOrder: {
        orderOrError: {
          order: {
            internalID: "order-id",
          },
        },
      },
    })

    expect(context.meOrderUpdateLoader).toHaveBeenCalledWith("order-id", {
      buyer_phone_number: null,
    })
  })

  it("propagates an error", async () => {
    context.meOrderUpdateLoader = jest
      .fn()
      .mockRejectedValue(new Error("Oops - Error updating order"))
    const result = await runAuthenticatedQuery(mockMutation, context)

    expect(result.errors).toBeUndefined()
    expect(result).toEqual({
      updateOrder: {
        orderOrError: {
          mutationError: {
            message: "Oops - Error updating order",
          },
        },
      },
    })
  })
})
