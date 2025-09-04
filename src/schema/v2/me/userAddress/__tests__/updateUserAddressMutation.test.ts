import gql from "lib/gql"
import { runAuthenticatedQuery } from "schema/v2/test/utils"

describe("updateUserAddressMutation", () => {
  const mockMeUpdateUserAddressLoader = jest.fn()
  const mockMeLoader = jest.fn()

  const context = {
    meUpdateUserAddressLoader: mockMeUpdateUserAddressLoader,
    meLoader: mockMeLoader,
  }

  beforeEach(() => {
    mockMeUpdateUserAddressLoader.mockResolvedValue({
      id: 12345,
      name: "Updated Home Address",
      address_line_1: "456 Oak Ave",
      city: "Los Angeles",
      region: "CA",
      postal_code: "90210",
      country: "US",
    })
    mockMeLoader.mockResolvedValue({ id: "user-42" })
  })

  afterEach(() => {
    mockMeUpdateUserAddressLoader.mockReset()
    mockMeLoader.mockReset()
  })

  it("updates a user address", async () => {
    const mutation = gql`
      mutation {
        updateUserAddress(
          input: {
            userAddressID: "12345"
            attributes: {
              name: "Updated Home Address"
              addressLine1: "456 Oak Ave"
              city: "Los Angeles"
              region: "CA"
              postalCode: "90210"
              country: "US"
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

    expect(mockMeUpdateUserAddressLoader).toHaveBeenCalledWith("12345", {
      name: "Updated Home Address",
      address_line_1: "456 Oak Ave",
      city: "Los Angeles",
      region: "CA",
      postal_code: "90210",
      country: "US",
    })
  })
})
