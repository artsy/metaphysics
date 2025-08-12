import gql from "lib/gql"
import { runAuthenticatedQuery } from "schema/v2/test/utils"
import config from "config"

const shouldSkip = !config.USE_UNSTITCHED_USER_ADDRESS

;(shouldSkip ? describe.skip : describe)(
  "updateUserDefaultAddressMutation",
  () => {
    const mockMeUpdateUserDefaultAddressLoader = jest.fn()
    const mockMeLoader = jest.fn()

    const context = {
      meUpdateUserDefaultAddressLoader: mockMeUpdateUserDefaultAddressLoader,
      meLoader: mockMeLoader,
    }

    beforeEach(() => {
      mockMeUpdateUserDefaultAddressLoader.mockResolvedValue({
        id: 12345,
        is_default: true,
      })
      mockMeLoader.mockResolvedValue({ id: "user-42" })
    })

    afterEach(() => {
      mockMeUpdateUserDefaultAddressLoader.mockReset()
      mockMeLoader.mockReset()
    })

    it("sets a user address as default", async () => {
      const mutation = gql`
        mutation {
          updateUserDefaultAddress(input: { userAddressID: "12345" }) {
            userAddressOrErrors {
              ... on UserAddress {
                internalID
                isDefault
              }
            }
            me {
              internalID
            }
          }
        }
      `

      await runAuthenticatedQuery(mutation, context)

      expect(mockMeUpdateUserDefaultAddressLoader).toHaveBeenCalledWith("12345")
    })
  }
)
