jest.mock("lib/loaders/cache/client", () => () => ({
  get: jest.fn(),
  set: jest.fn(),
}))
// import client from "lib/loaders/cache/client"

import cache, { client as internalClient } from "lib/cache"

describe("Cache", () => {
  describe("when connection to Redis fails", () => {
    describe("#get", () => {
      it("falls through with a rejection", () => {
        internalClient.get.mockImplementationOnce((key, cb) => cb(new Error("connect ECONNREFUSED")))

        return cache.get("foobar").catch(e => {
          expect(e.message).toEqual("connect ECONNREFUSED")
        })
      })
    })
  })

  describe("when successfully connected to the cache", () => {
    describe("#get", () => {
      it("parses the data and resolves the promise", () => {
        internalClient.get.mockImplementationOnce((key, cb) => cb(null, JSON.stringify({ bar: "baz" })))

        return cache.get("get_foo").then(data => {
          expect(data.bar).toBe("baz")
        })
      })
    })

    describe("#set", () => {
      beforeEach(internalClient.set.mockClear)

      describe("with a plain Object", () => {
        it("sets the cache and includes a timestamp", () => {
          cache.set("set_foo", { bar: "baz" })
          expect(internalClient.set).toBeCalledWith("set_foo", expect.stringContaining("cached"), expect.anything())

          const data = internalClient.set.mock.calls[0][1]
          const parsed = JSON.parse(data)

          expect(parsed.bar).toBe("baz")
          expect(typeof parsed.cached).toBe("number")
        })
      })

      describe("with an Array", () => {
        it("sets the cache and includes a timestamp", () => {
          cache.set("set_bar", [{ baz: "qux" }])
          expect(internalClient.set).toBeCalledWith("set_bar", expect.stringContaining("cached"), expect.anything())

          const data = internalClient.set.mock.calls[0][1]
          const parsed = JSON.parse(data)

          expect(parsed.length).toBe(1)
          expect(parsed[0].baz).toBe("qux")
          expect(typeof parsed[0].cached).toBe("number")
        })
      })
    })
  })
})
