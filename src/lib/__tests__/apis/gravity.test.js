import gravity from "lib/apis/gravity"

jest.mock("../../apis/fetch", () => jest.fn(() => Promise.resolve({})))
import fetch from "../../apis/fetch"

import config from "config"
config.GRAVITY_XAPP_TOKEN = "secret"

describe("APIs", () => {
  describe("gravity", () => {
    it("makes a correct request to Gravity", async () => {
      await gravity("foo/bar", null, { userAgent: "catty browser" })

      const url = "https://api.artsy.test/api/v1/foo/bar"
      const requestConfig = {
        headers: { "X-XAPP-TOKEN": "secret" },
        userAgent: "catty browser",
      }

      expect(fetch).toBeCalledWith(url, requestConfig)
    })

    it("resolves when there is a successful JSON response", async () => {
      fetch.mockReturnValueOnce(Promise.resolve({ foo: "bar" }))

      const response = await gravity("foo/bar")
      expect(response.foo).toBe("bar")
    })
  })
})
