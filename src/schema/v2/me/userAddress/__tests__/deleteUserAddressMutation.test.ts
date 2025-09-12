import gql from "lib/gql"
import { runAuthenticatedQuery } from "schema/v2/test/utils"

describe("deleteUserAddressMutation", () => {
  const mockMeDeleteUserAddressLoader = jest.fn()
  const mockMeLoader = jest.fn()

  const context = {
    meDeleteUserAddressLoader: mockMeDeleteUserAddressLoader,
    meLoader: mockMeLoader,
  }

  beforeEach(() => {
    mockMeDeleteUserAddressLoader.mockResolvedValue({
      id: 12345,
    })
    mockMeLoader.mockResolvedValue({ id: "user-42" })
  })

  afterEach(() => {
    mockMeDeleteUserAddressLoader.mockReset()
    mockMeLoader.mockReset()
  })

  it("deletes a user address", async () => {
    const mutation = gql`
      mutation {
        deleteUserAddress(input: { userAddressID: "12345" }) {
          userAddressOrErrors {
            ... on UserAddress {
              internalID
            }
          }
          me {
            internalID
          }
        }
      }
    `

    await runAuthenticatedQuery(mutation, context)

    expect(mockMeDeleteUserAddressLoader).toHaveBeenCalledWith("12345")
  })

  it("handles deletion errors", async () => {
    const errorResponse = {
      errors: [{ message: "Address not found" }],
    }
    mockMeDeleteUserAddressLoader.mockRejectedValue(errorResponse)

    const mutation = gql`
      mutation {
        deleteUserAddress(input: { userAddressID: "nonexistent" }) {
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

    expect(mockMeDeleteUserAddressLoader).toHaveBeenCalledWith("nonexistent")
  })
})
