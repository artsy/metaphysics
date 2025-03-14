import { graphql } from "graphql"
import { runAuthenticatedQuery } from "schema/v2/test/utils"

const mockMutation = `
  mutation {
    editMeOrder(input: {
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
      order {
        id
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
`

describe("editMeOrderMutation", () => {
  it("should update an order with all fields", async () => {
    const context = {
      meOrderEditLoader: jest.fn().mockResolvedValue({
        id: "order-id",
        buyerPhoneNumber: "123-456-7890",
        buyerPhoneNumberCountryCode: "+1",
        shippingName: "John Doe",
        shippingAddressLine1: "123 Main St",
        shippingAddressLine2: "Apt 4B",
        shippingCity: "New York",
        shippingRegion: "NY",
        shippingCountry: "US",
        shippingPostalCode: "10001",
      }),
    }

    const result = await runAuthenticatedQuery(mockMutation, context)

    expect(result.errors).toBeUndefined()
    expect(result.data).toEqual({
      editMeOrder: {
        order: {
          id: "order-id",
          buyerPhoneNumber: "123-456-7890",
          buyerPhoneNumberCountryCode: "+1",
          shippingName: "John Doe",
          shippingAddressLine1: "123 Main St",
          shippingAddressLine2: "Apt 4B",
          shippingCity: "New York",
          shippingRegion: "NY",
          shippingCountry: "US",
          shippingPostalCode: "10001",
        },
      },
    })
  })
})
