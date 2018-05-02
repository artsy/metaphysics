jest.mock("../../apis/fetch", () => jest.fn(() => Promise.resolve({})))
import fetch from "../../apis/fetch"

import galaxy from "lib/apis/galaxy"

describe("APIs", () => {
  describe("galaxy", () => {
    it("makes a correct request to Gravity", async () => {
      await galaxy("foo/bar", null, { userAgent: "catty browser" })

      const url = "https://galaxy-staging-herokuapp.com/foo/bar"
      const requestConfig = {
        headers: {
          Accept: "application/vnd.galaxy-public+json",
          "Content-Type": "application/hal+json",
          "Http-Authorization": "galaxy_token",
        },
      }

      expect(fetch).toBeCalledWith(url, requestConfig)
    })

    it("resolves when there is a successful JSON response", async () => {
      fetch.mockReturnValueOnce(Promise.resolve({ foo: "bar" }))

      const response = await galaxy("foo/bar")
      expect(response.foo).toBe("bar")
    })
  })
})
