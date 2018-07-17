/* eslint-disable promise/always-return */
import zlib from 'zlib'
import config from "config"

let cache, client, cacheKey

beforeEach(() => {
  cache = require("lib/cache").default
  client = require("lib/cache").client
  cacheKey = require("lib/cache").cacheKey
})

function parseCacheResponse(data, cacheCompressionDisabled) {
  if (cacheCompressionDisabled) {
    return JSON.parse(data)
  } else {
    return JSON.parse(
      zlib.inflateSync(
        new Buffer(data, 'base64')
      ).toString()
    )
  }
}

describe("Cache with compression enabled", () => {
  config.CACHE_COMPRESSION_DISABLED = true
  expect(config.CACHE_COMPRESSION_DISABLED).toBe(true)
  describe("when successfully connected to the cache", () => {
    describe("#get", () => {
      beforeEach(async () => await cache.set("get_foo", { bar: "baz" }))

      it("parses the data and resolves the promise", () => {
        return cache.get("get_foo").then(data => {
          expect(data.bar).toBe("baz")
        })
      })
    })

    describe("#delete", () => {
      beforeEach(async () => await cache.set("get_foo", { bar: "baz" }))

      it("deletes the data", () => {
        cache.delete("get_foo")
        return cache.get("get_foo").catch(e => {
          expect(e.message).toEqual("[Cache#get] Cache miss")
        })
      })
    })

    describe("#set", () => {
      describe("with a plain Object", () => {
        it("sets the cache and includes a timestamp", async (done) => {
          await cache.set("set_foo", { bar: "baz" })

          client.get(cacheKey("set_foo"), (err, data) => {
            const parsed = parseCacheResponse(data, config.CACHE_COMPRESSION_DISABLED)

            expect(parsed.bar).toBe("baz")
            expect(typeof parsed.cached).toBe("number")

            done()
          })
        })
      })

      it("with an Array it sets the cache and includes a timestamp", async (done) => {
        await cache.set("set_bar", [{ baz: "qux" }])

        client.get(cacheKey("set_bar"), (err, data) => {
          const parsed = parseCacheResponse(data, config.CACHE_COMPRESSION_DISABLED)

          expect(parsed.length).toBe(1)
          expect(parsed[0].baz).toBe("qux")
          expect(typeof parsed[0].cached).toBe("number")

          done()
        })
      })
    })
  })
})


describe("Cache with compression disabled", () => {
  config.CACHE_COMPRESSION_DISABLED = false
  expect(config.CACHE_COMPRESSION_DISABLED).toBe(false)
  describe("when successfully connected to the cache", () => {
    describe("#get", () => {
      beforeEach(async () => await cache.set("get_foo", { bar: "baz" }))

      it("parses the data and resolves the promise", () => {
        return cache.get("get_foo").then(data => {
          expect(data.bar).toBe("baz")
        })
      })
    })

    describe("#delete", () => {
      beforeEach(async () => await cache.set("get_foo", { bar: "baz" }))

      it("deletes the data", () => {
        cache.delete("get_foo")
        return cache.get("get_foo").catch(e => {
          expect(e.message).toEqual("[Cache#get] Cache miss")
        })
      })
    })

    describe("#set", () => {
      describe("with a plain Object", () => {
        it("sets the cache and includes a timestamp", async (done) => {
          await cache.set("set_foo", { bar: "baz" })

          client.get(cacheKey("set_foo"), (err, data) => {
            const parsed = parseCacheResponse(data, config.CACHE_COMPRESSION_DISABLED)

            expect(parsed.bar).toBe("baz")
            expect(typeof parsed.cached).toBe("number")

            done()
          })
        })
      })

      it("with an Array it sets the cache and includes a timestamp", async (done) => {
        await cache.set("set_bar", [{ baz: "qux" }])

        client.get(cacheKey("set_bar"), (err, data) => {
          const parsed = parseCacheResponse(data, config.CACHE_COMPRESSION_DISABLED)

          expect(parsed.length).toBe(1)
          expect(parsed[0].baz).toBe("qux")
          expect(typeof parsed[0].cached).toBe("number")

          done()
        })
      })
    })
  })
})
