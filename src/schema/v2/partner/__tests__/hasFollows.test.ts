import { runAuthenticatedQuery } from "schema/v2/test/utils"
import gql from "lib/gql"

describe("Partner", () => {
  describe("hasFollows field", () => {
    it("returns true when follows_count is greater than 500", async () => {
      const query = gql`
        {
          partner(id: "example-partner") {
            hasFollows
          }
        }
      `

      const partnerLoader = jest.fn().mockReturnValue(
        Promise.resolve({
          id: "example-partner",
          default_profile_id: "example-profile",
        })
      )

      const profileLoader = jest.fn().mockReturnValue(
        Promise.resolve({
          follows_count: 501,
        })
      )

      const { partner } = await runAuthenticatedQuery(query, {
        partnerLoader,
        profileLoader,
        userID: "user-id",
        accessToken: "access-token",
      })

      expect(profileLoader).toHaveBeenCalledWith("example-profile")
      expect(partner.hasFollows).toBe(true)
    })

    it("returns false when follows_count is equal to 500", async () => {
      const query = gql`
        {
          partner(id: "example-partner") {
            hasFollows
          }
        }
      `

      const partnerLoader = jest.fn().mockReturnValue(
        Promise.resolve({
          id: "example-partner",
          default_profile_id: "example-profile",
        })
      )

      const profileLoader = jest.fn().mockReturnValue(
        Promise.resolve({
          follows_count: 500,
        })
      )

      const { partner } = await runAuthenticatedQuery(query, {
        partnerLoader,
        profileLoader,
        userID: "user-id",
        accessToken: "access-token",
      })

      expect(profileLoader).toHaveBeenCalledWith("example-profile")
      expect(partner.hasFollows).toBe(false)
    })

    it("returns false when follows_count is less than 500", async () => {
      const query = gql`
        {
          partner(id: "example-partner") {
            hasFollows
          }
        }
      `

      const partnerLoader = jest.fn().mockReturnValue(
        Promise.resolve({
          id: "example-partner",
          default_profile_id: "example-profile",
        })
      )

      const profileLoader = jest.fn().mockReturnValue(
        Promise.resolve({
          follows_count: 499,
        })
      )

      const { partner } = await runAuthenticatedQuery(query, {
        partnerLoader,
        profileLoader,
        userID: "user-id",
        accessToken: "access-token",
      })

      expect(profileLoader).toHaveBeenCalledWith("example-profile")
      expect(partner.hasFollows).toBe(false)
    })

    it("returns false when profileLoader throws an error", async () => {
      const query = gql`
        {
          partner(id: "example-partner") {
            hasFollows
          }
        }
      `

      const partnerLoader = jest.fn().mockReturnValue(
        Promise.resolve({
          id: "example-partner",
          default_profile_id: "example-profile",
        })
      )

      const profileLoader = jest
        .fn()
        .mockRejectedValue(new Error("Failed to load profile"))

      const { partner } = await runAuthenticatedQuery(query, {
        partnerLoader,
        profileLoader,
        userID: "user-id",
        accessToken: "access-token",
      })

      expect(profileLoader).toHaveBeenCalledWith("example-profile")
      expect(partner.hasFollows).toBe(false)
    })

    it("returns false when user is not authenticated", async () => {
      const query = gql`
        {
          partner(id: "example-partner") {
            hasFollows
          }
        }
      `

      const partnerLoader = jest.fn().mockReturnValue(
        Promise.resolve({
          id: "example-partner",
          default_profile_id: "example-profile",
        })
      )

      const profileLoader = jest.fn()

      const { partner } = await runAuthenticatedQuery(query, {
        partnerLoader,
        profileLoader,
        userID: undefined,
        accessToken: undefined,
      })

      expect(partner.hasFollows).toBe(false)
      expect(profileLoader).not.toHaveBeenCalledWith("example-profile")
    })
  })
})
