import { runAuthenticatedQuery } from "schema/v2/test/utils"
import gql from "lib/gql"

describe("Profile", () => {
  describe("hasFollows field", () => {
    it("returns true when follows_count is greater than 500", async () => {
      const query = gql`
        {
          profile(id: "example-profile") {
            counts {
              hasFollows
            }
          }
        }
      `

      const profileLoader = jest.fn().mockReturnValue(
        Promise.resolve({
          follows_count: 501,
        })
      )

      const { profile } = await runAuthenticatedQuery(query, {
        profileLoader,
      })

      expect(profileLoader).toBeCalledWith("example-profile")
      expect(profile.counts.hasFollows).toBe(true)
    })

    it("returns false when follows_count is equal to 500", async () => {
      const query = gql`
        {
          profile(id: "example-profile") {
            counts {
              hasFollows
            }
          }
        }
      `

      const profileLoader = jest.fn().mockReturnValue(
        Promise.resolve({
          follows_count: 500,
        })
      )

      const { profile } = await runAuthenticatedQuery(query, {
        profileLoader,
      })

      expect(profileLoader).toBeCalledWith("example-profile")
      expect(profile.counts.hasFollows).toBe(false)
    })

    it("returns false when follows_count is less than 500", async () => {
      const query = gql`
        {
          profile(id: "example-profile") {
            counts {
              hasFollows
            }
          }
        }
      `

      const profileLoader = jest.fn().mockReturnValue(
        Promise.resolve({
          follows_count: 499,
        })
      )

      const { profile } = await runAuthenticatedQuery(query, {
        profileLoader,
      })

      expect(profileLoader).toBeCalledWith("example-profile")
      expect(profile.counts.hasFollows).toBe(false)
    })
  })
})
