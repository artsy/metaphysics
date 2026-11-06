/* eslint-disable promise/always-return */
import config from "config"

let cache, apiLoaderWithoutAuthenticationFactory

describe("API loaders uncached", () => {
  let api = null
  let apiLoader = null
  let loader = null

  describe("without authentication", () => {
    beforeEach(() => {
      config.CACHE_DISABLED = true
      cache = require("lib/cache").default
      apiLoaderWithoutAuthenticationFactory = require("lib/loaders/api/loader_without_authentication_factory")
        .apiLoaderWithoutAuthenticationFactory

      api = jest.fn((path, accessToken, options) =>
        Promise.resolve({ body: { path, accessToken, options } })
      )
      apiLoader = apiLoaderWithoutAuthenticationFactory(api, "test_name", {
        requestIDs: { requestID: "1234" },
        userAgent: "catty browser",
      })
      loader = apiLoader("some/path")
    })

    it("does not try to pass an access token", () => {
      return loader().then(({ accessToken }) => {
        expect(accessToken).toEqual(null)
      })
    })

    it("does not cache the response in memcache", () => {
      const spy = jest.spyOn(cache, "set")
      return cache
        .get("some/unauthenticated/path?")
        .then(() => {
          throw new Error("Did not expect to be cached yet!")
        })
        .catch(() => {
          loader = apiLoader("some/unauthenticated/path")
          return loader().then(() => {
            expect(spy).not.toHaveBeenCalled()
          })
        })
    })
  })
})
