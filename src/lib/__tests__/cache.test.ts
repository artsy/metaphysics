import zlib from "zlib"
import config from "config"
import cache, { client, cacheKey } from "lib/cache"

jest.mock("lib/tracer", () => {
  return {
    cacheTracer: {
      get: jest.fn((promise) => promise),
      set: jest.fn((promise) => promise),
      delete: jest.fn((promise) => promise),
    },
  }
})

function parseCacheResponse(data, cacheCompressionDisabled) {
  if (cacheCompressionDisabled) {
    return JSON.parse(data)
  } else {
    return JSON.parse(zlib.inflateSync(Buffer.from(data, "base64") as any).toString()) // FIXME: copilot type error
  }
}

describe("Cache with compression enabled", () => {
  config.CACHE_COMPRESSION_DISABLED = true

  // FIXME:
  // eslint-disable-next-line jest/no-standalone-expect
  expect(config.CACHE_COMPRESSION_DISABLED).toBe(true)

  describe("when successfully connected to the cache", () => {
    describe("#get", () => {
      beforeEach(async () => await cache.set("get_foo", { bar: "baz" }))

      it("parses the data and resolves the promise", async () => {
        const data = await cache.get("get_foo")

        expect(data.bar).toBe("baz")
      })
    })

    describe("#delete", () => {
      beforeEach(async () => await cache.set("get_foo", { bar: "baz" }))

      it("deletes the data", async () => {
        expect.assertions(1)

        await cache.delete("get_foo")

        let data

        try {
          data = await cache.get("get_foo")

          throw new Error("unexpected error")
        } catch {
          // no-op
        }

        expect(data).toBeUndefined()
      })
    })

    describe("#set", () => {
      describe("with a plain Object", () => {
        it("sets the cache and includes a timestamp", async () => {
          expect.assertions(2)

          await cache.set("set_foo", { bar: "baz" })

          client.get(cacheKey("set_foo"), (_err, data) => {
            const parsed = parseCacheResponse(
              data,
              config.CACHE_COMPRESSION_DISABLED
            )

            expect(parsed.bar).toBe("baz")
            expect(typeof parsed.cached).toBe("number")
          })
        })
      })

      it("with an Array it sets the cache and includes a timestamp", async () => {
        expect.assertions(3)

        await cache.set("set_bar", [{ baz: "qux" }])

        client.get(cacheKey("set_bar"), (_err, data) => {
          const parsed = parseCacheResponse(
            data,
            config.CACHE_COMPRESSION_DISABLED
          )

          expect(parsed.length).toBe(1)
          expect(parsed[0].baz).toBe("qux")
          expect(typeof parsed[0].cached).toBe("number")
        })
      })
    })
  })
})

describe("Cache with compression disabled", () => {
  config.CACHE_COMPRESSION_DISABLED = false

  // FIXME:
  // eslint-disable-next-line jest/no-standalone-expect
  expect(config.CACHE_COMPRESSION_DISABLED).toBe(false) // check that the config is mocked

  describe("when successfully connected to the cache", () => {
    describe("#get", () => {
      beforeEach(async () => await cache.set("get_foo", { bar: "baz" }))

      it("parses the data and resolves the promise", async () => {
        const data = await cache.get("get_foo")

        expect(data.bar).toBe("baz")
      })
    })

    describe("#delete", () => {
      beforeEach(async () => await cache.set("get_foo", { bar: "baz" }))

      it("deletes the data", async () => {
        expect.assertions(1)

        await cache.delete("get_foo")

        let data

        try {
          data = await cache.get("get_foo")

          throw new Error("unexpected error")
        } catch {
          // no-op
        }

        expect(data).toBeUndefined()
      })
    })

    describe("#set", () => {
      describe("with a plain Object", () => {
        it("sets the cache and includes a timestamp", async () => {
          expect.assertions(2)

          await cache.set("set_foo", { bar: "baz" })

          client.get(cacheKey("set_foo"), (_err, data) => {
            const parsed = parseCacheResponse(
              data,
              config.CACHE_COMPRESSION_DISABLED
            )

            expect(parsed.bar).toBe("baz")
            expect(typeof parsed.cached).toBe("number")
          })
        })
      })

      it("with an Array it sets the cache and includes a timestamp", async () => {
        expect.assertions(3)

        await cache.set("set_bar", [{ baz: "qux" }])

        client.get(cacheKey("set_bar"), (_err, data) => {
          const parsed = parseCacheResponse(
            data,
            config.CACHE_COMPRESSION_DISABLED
          )

          expect(parsed.length).toBe(1)
          expect(parsed[0].baz).toBe("qux")
          expect(typeof parsed[0].cached).toBe("number")
        })
      })
    })
  })
})
