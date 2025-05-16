import { runAuthenticatedQuery } from "schema/v2/test/utils"
import gql from "lib/gql"

describe("me.pricePreference", () => {
  describe("when the data is present in Vortex", () => {
    it("returns the user's price preference from Vortex", async () => {
      const query = gql`
        {
          me {
            pricePreference
          }
        }
      `

      const userPricePreferenceLoader = jest.fn().mockResolvedValue({
        data: [
          {
            user_id: "abc123",
            price_preference: 2500.0,
          },
        ],
      })

      const context = {
        meLoader: jest.fn().mockResolvedValue({}),
        userPricePreferenceLoader,
      }

      const response = await runAuthenticatedQuery(query, context)

      expect(response).toEqual({
        me: {
          pricePreference: 2500.0,
        },
      })
    })
  })

  describe("when the data is not present in Vortex", () => {
    it("returns null", async () => {
      const query = gql`
        {
          me {
            pricePreference
          }
        }
      `

      const userPricePreferenceLoader = jest.fn().mockResolvedValue({
        data: [],
      })

      const context = {
        meLoader: jest.fn().mockResolvedValue({}),
        userPricePreferenceLoader,
      }

      const response = await runAuthenticatedQuery(query, context)

      expect(response).toEqual({
        me: {
          pricePreference: null,
        },
      })
    })
  })
})
