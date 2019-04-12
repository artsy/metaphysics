/* eslint-disable promise/always-return */

jest.mock("lib/cache")

import { apiLoaderWithoutAuthenticationFactory } from "../api/loader_without_authentication_factory"
import config from "config"
import { set } from "lib/cache"

config.CACHE_DISABLED = true

const apiLoader = apiLoaderWithoutAuthenticationFactory(
  (path, accessToken, options) =>
    Promise.resolve({ body: { path, accessToken, options } }),
  "test_name",
  {
    requestIDs: { requestID: "1234", xForwardedFor: "127.0.0.1" },
    userAgent: "catty browser",
  }
)

const loader = apiLoader("some/path")

describe("API loaders uncached", () => {
  describe("without authentication", () => {
    it("does not try to pass an access token", async () => {
      const { accessToken } = await loader()
      expect(accessToken).toEqual(null)
    })

    it("does not cache the response in memcache", async () => {
      await loader()
      expect(set).not.toBeCalled()
    })
  })
})
