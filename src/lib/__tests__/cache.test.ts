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
    return JSON.parse(zlib.inflateSync(Buffer.from(data, "base64")).toString())
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

describe("cacheKey", () => {
  // Derive the active prefix from a short key so assertions don't depend on the
  // namespace/compression config.
  const prefix = cacheKey("")

  it("returns short keys verbatim (prefix + key)", () => {
    expect(cacheKey("artists/andy-warhol")).toBe(prefix + "artists/andy-warhol")
  })

  it("hashes keys that would exceed memcached's 250-byte limit", () => {
    const longKey =
      "articles/counts?" +
      Array.from(
        { length: 50 },
        (_x, i) => `artist_ids[]=${i}${"a".repeat(23)}`
      ).join("&")

    const result = cacheKey(longKey)

    expect(longKey.length).toBeGreaterThan(250)
    expect(result.length).toBeLessThanOrEqual(250)
    expect(result.startsWith(prefix + "h:")).toBe(true)
    expect(result.slice((prefix + "h:").length)).toMatch(/^[0-9a-f]{32}$/)
  })

  it("is deterministic and collision-free for long keys", () => {
    const a = "x".repeat(400)
    const b = "y".repeat(400)

    expect(cacheKey(a)).toBe(cacheKey(a))
    expect(cacheKey(a)).not.toBe(cacheKey(b))
  })
})
