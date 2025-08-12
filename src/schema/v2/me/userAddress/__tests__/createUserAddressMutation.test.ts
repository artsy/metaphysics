import gql from "lib/gql"
import { runAuthenticatedQuery } from "schema/v2/test/utils"
import config from "config"

const shouldSkip = !config.USE_UNSTITCHED_USER_ADDRESS

;(shouldSkip ? describe.skip : describe)("createUserAddressMutation", () => {
  const mockMeCreateUserAddressLoader = jest.fn()
  const mockMeLoader = jest.fn()

  const context = {
    meCreateUserAddressLoader: mockMeCreateUserAddressLoader,
    meLoader: mockMeLoader,
  }

  beforeEach(() => {
    mockMeCreateUserAddressLoader.mockResolvedValue({
      id: 12345,
      name: "Home Address",
      address_line_1: "123 Main St",
      address_line_2: "Apt 4B",
      city: "New York",
      region: "NY",
      postal_code: "10001",
      country: "US",
      phone_number: "(555) 123-4567",
      phone_number_country_code: "US",
      is_default: false,
    })
    mockMeLoader.mockResolvedValue({ id: "user-42" })
  })

  afterEach(() => {
    mockMeCreateUserAddressLoader.mockReset()
    mockMeLoader.mockReset()
  })

  it("creates a user address", async () => {
    const mutation = gql`
      mutation {
        createUserAddress(
          input: {
            attributes: {
              name: "Home Address"
              addressLine1: "123 Main St"
              addressLine2: "Apt 4B"
              city: "New York"
              region: "NY"
              postalCode: "10001"
              country: "US"
              phoneNumber: "(555) 123-4567"
              phoneNumberCountryCode: "US"
            }
          }
        ) {
          userAddressOrErrors {
            ... on UserAddress {
              internalID
              name
            }
          }
          me {
            internalID
          }
        }
      }
    `

    await runAuthenticatedQuery(mutation, context)

    expect(mockMeCreateUserAddressLoader).toHaveBeenCalledWith({
      name: "Home Address",
      address_line_1: "123 Main St",
      address_line_2: "Apt 4B",
      city: "New York",
      region: "NY",
      postal_code: "10001",
      country: "US",
      phone_number: "(555) 123-4567",
      phone_number_country_code: "US",
    })
  })

  it("handles creation errors", async () => {
    const errorResponse = {
      errors: [{ message: "Name can't be blank" }],
    }
    mockMeCreateUserAddressLoader.mockRejectedValue(errorResponse)

    const mutation = gql`
      mutation {
        createUserAddress(
          input: {
            attributes: { name: "", addressLine1: "", city: "", country: "" }
          }
        ) {
          userAddressOrErrors {
            ... on UserAddress {
              internalID
            }
            ... on Errors {
              errors {
                message
              }
            }
          }
        }
      }
    `

    await runAuthenticatedQuery(mutation, context)

    expect(mockMeCreateUserAddressLoader).toHaveBeenCalledWith({
      name: "",
      address_line_1: "",
      city: "",
      country: "",
    })
  })
})
