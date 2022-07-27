import { runAuthenticatedQuery } from "schema/v2/test/utils"

describe("Me", () => {
  describe("UserFlags", () => {
    it("returns the userFlags", async () => {
      const query = `
        {
          me {
            profession
            userFlags
          }
        }
      `

      const loaders = {
        meLoader: () =>
          Promise.resolve({
            profession: "dev",
            user_flags: { my_flag: "something" },
          }),
      }

      const data = await runAuthenticatedQuery(query, loaders)
      expect(data.me.userFlags.myFlag).not.toBe(undefined)
    })
  })
})
