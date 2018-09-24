/* eslint-disable promise/always-return */
import { apiLoaderWithAuthenticationFactory } from "lib/loaders/api/loader_with_authentication_factory"
import { apiLoaderWithoutAuthenticationFactory } from "lib/loaders/api/loader_without_authentication_factory"

import cache from "lib/cache"

describe("API loaders", () => {
  let api = null
  let apiLoader = null
  let loader = null

  beforeEach(() => {
    api = jest.fn((path, accessToken, options) =>
      Promise.resolve({ body: { path, accessToken, options } })
    )
  })

  const sharedExamples = () => {
    describe("concerning path", () => {
      it("generates path specific loaders", () => {
        return loader().then(({ path }) => {
          expect(path).toEqual("some/path?")
        })
      })

      it("yields a given ID to the loader", () => {
        loader = apiLoader(id => `some/path/with/id/${id}`)
        return loader(42).then(({ path }) => {
          expect(path).toEqual("some/path/with/id/42?")
        })
      })

      it("appends params to the path", () => {
        return loader({ some: "param" }).then(({ path }) => {
          expect(path).toEqual("some/path?some=param")
        })
      })

      it("sets default params and merges with specific params", () => {
        loader = apiLoader("some/path", { defaultParam: "value" })
        return loader({ some: "param" }).then(({ path }) => {
          expect(path).toEqual("some/path?defaultParam=value&some=param")
        })
      })
    })

    it("caches the response for the lifetime of the loader", () => {
      return Promise.all([loader(), loader()]).then(responses => {
        expect(responses.map(({ path }) => path)).toEqual([
          "some/path?",
          "some/path?",
        ])
        expect(api.mock.calls.length).toEqual(1)
      })
    })

    it("passes options for the api function on", () => {
      // Needs to be a new path so that it hasn’t been cached in memcache yet
      loader = apiLoader("some/post/path", {}, { method: "POST" })
      return loader().then(({ options }) =>
        expect(options.method).toEqual("POST")
      )
    })
  }

  describe("without authentication", () => {
    beforeEach(() => {
      apiLoader = apiLoaderWithoutAuthenticationFactory(api, "test_name", {
        requestIDs: { requestID: "1234" },
        userAgent: "catty browser",
      })
      loader = apiLoader("some/path")
    })

    sharedExamples()

    it("does not try to pass an access token", () => {
      return loader().then(({ accessToken }) => {
        expect(accessToken).toEqual(null)
      })
    })

    it("caches the response in memcache", () => {
      const spy = jest.spyOn(cache, "set")
      return cache
        .get("some/unauthenticated/memcached/path?")
        .then(() => {
          throw new Error("Did not expect to be cached yet!")
        })
        .catch(() => {
          loader = apiLoader("some/unauthenticated/memcached/path")
          return loader().then(() => {
            expect(spy).toHaveBeenCalled()
          })
        })
    })
  })

  describe("with authentication", () => {
    beforeEach(() => {
      apiLoader = apiLoaderWithAuthenticationFactory(api, "test_name", {
        userAgent: "catty browser",
        requestIDs: {
          requestID: 1234,
        },
      })(() => Promise.resolve("secret-token"))
      loader = apiLoader("some/path")
    })

    sharedExamples()

    it("does pass an access token", () => {
      return loader().then(({ accessToken }) => {
        expect(accessToken).toEqual("secret-token")
      })
    })

    it("does NOT cache the response in memcache", () => {
      loader = apiLoader("some/authenticated/memcached/path")
      return loader().then(() => {
        return cache
          .get("some/authenticated/memcached/path?")
          .then(() => {
            throw new Error("Did not expect response to be cached!")
          })
          .catch(() => {
            // swallow the error, because this is the expected code-path
          })
      })
    })
  })
})
