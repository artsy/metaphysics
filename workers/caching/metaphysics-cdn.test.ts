import { jest } from "@jest/globals"

describe("metaphysics-cdn fetch handler", () => {
  let fetchHandler: (request: Request, env: any, ctx: any) => Promise<Response>
  let mockCache: any
  let getPageTag: (request: Request) => string | null

  beforeEach(async () => {
    // Import the fetch handler
    const module = await import("./metaphysics-cdn")
    fetchHandler = module.default.fetch
    getPageTag = module.getPageTag

    // Mock the caches.default object
    mockCache = {
      match: jest.fn(),
      put: jest.fn(),
    }
    global.caches = { default: mockCache }

    // Mock the crypto.subtle.digest function
    global.crypto = {
      subtle: {
        digest: jest.fn(async (algorithm, _data) => {
          if (algorithm !== "SHA-256") {
            throw new Error("Unsupported algorithm")
          }
          // Mock a hash result (32 bytes for SHA-256)
          return new Uint8Array(32).fill(1).buffer
        }),
      },
    }
  })

  it("handles preflight OPTIONS requests", async () => {
    const request = new Request("https://example.artsy.net", {
      method: "OPTIONS",
      headers: {
        "access-control-request-method": "POST",
        origin: "https://example.artsy.net",
      },
    })

    const response = await fetchHandler(request, {}, {})

    expect(response.status).toBe(204)
    expect(response.headers.get("Access-Control-Allow-Methods")).toBe(
      "GET,POST,OPTIONS"
    )
    expect(response.headers.get("Access-Control-Allow-Origin")).toBe("*")
    expect(response.headers.get("Access-Control-Max-Age")).toBe("600")
    expect(response.headers.get("Content-Length")).toBe("0")
  })

  it("returns a cached response for POST requests if available", async () => {
    const request = new Request("https://example.com", {
      method: "POST",
      body: JSON.stringify({ key: "value" }),
    })

    const cachedResponse = new Response("Cached response")
    mockCache.match.mockResolvedValueOnce(cachedResponse)

    const response = await fetchHandler(request, {}, {})

    expect(mockCache.match).toHaveBeenCalled()
    expect(response.status).toBe(200)
    expect(await response.text()).toBe("Cached response")
  })

  it("fetches from origin and caches the response if not cached", async () => {
    const request = new Request("https://example.com", {
      method: "POST",
      body: JSON.stringify({ key: "value" }),
    })

    mockCache.match.mockResolvedValueOnce(null)

    const originResponse = new Response("Origin response", { status: 200 })
    global.fetch = jest.fn().mockResolvedValueOnce(originResponse)

    const ctx = { waitUntil: jest.fn() }
    const response = await fetchHandler(request, {}, ctx)

    expect(mockCache.match).toHaveBeenCalled()
    expect(global.fetch).toHaveBeenCalledWith(request)
    expect(ctx.waitUntil).toHaveBeenCalled()
    expect(response.status).toBe(200)
    expect(await response.text()).toBe("Origin response")
  })

  it("bypasses caching if cache-control header includes no-cache", async () => {
    const request = new Request("https://example.com", {
      method: "POST",
      headers: { "cache-control": "no-cache" },
      body: JSON.stringify({ key: "value" }),
    })

    global.fetch = jest
      .fn()
      .mockResolvedValueOnce(new Response("Origin response"))

    const response = await fetchHandler(request, {}, {})

    expect(mockCache.match).not.toHaveBeenCalled()
    expect(global.fetch).toHaveBeenCalledWith(request)
    expect(response.status).toBe(200)
    expect(await response.text()).toBe("Origin response")
  })
  describe("page cache tags", () => {
    const fetchWithMiss = async (headers: Record<string, string>) => {
      const request = new Request("https://example.com", {
        method: "POST",
        headers,
        body: JSON.stringify({ key: "value" }),
      })

      mockCache.match.mockResolvedValueOnce(null)
      global.fetch = jest
        .fn()
        .mockResolvedValueOnce(new Response("Origin response", { status: 200 }))

      const ctx = { waitUntil: jest.fn() }
      const response = await fetchHandler(request, {}, ctx)
      const [, cachedResponse] = mockCache.put.mock.calls[0]

      return { response, cachedResponse: cachedResponse as Response }
    }

    it("tags the cached response with the page path", async () => {
      const { response, cachedResponse } = await fetchWithMiss({
        "x-artsy-page-path": "/feature/the-artsy-vanguard-2027",
      })

      expect(cachedResponse.headers.get("Cache-Tag")).toBe(
        "force-page:/feature/the-artsy-vanguard-2027"
      )
      expect(response.headers.get("Cache-Tag")).toBeNull()
    })

    it("does not tag the cached response without the page path header", async () => {
      const { cachedResponse } = await fetchWithMiss({})

      expect(cachedResponse.headers.get("Cache-Tag")).toBeNull()
    })

    it("does not tag the cached response when the tag would be invalid", async () => {
      const { cachedResponse } = await fetchWithMiss({
        "x-artsy-page-path": "/artist/a,b",
      })

      expect(cachedResponse.headers.get("Cache-Tag")).toBeNull()
    })
  })

  describe("getPageTag", () => {
    const tagFor = (path: string) =>
      getPageTag(
        new Request("https://example.com", {
          headers: { "x-artsy-page-path": path },
        })
      )

    it.each([
      [
        "/feature/the-artsy-vanguard-2027",
        "force-page:/feature/the-artsy-vanguard-2027",
      ],
      [
        "/Feature/The-Artsy-Vanguard-2027",
        "force-page:/feature/the-artsy-vanguard-2027",
      ],
      [
        "/feature/the-artsy-vanguard-2027/",
        "force-page:/feature/the-artsy-vanguard-2027",
      ],
      ["/collect?sort=-published_at#top", "force-page:/collect"],
      ["/artist/caf%C3%A9", "force-page:/artist/caf%c3%a9"],
      ["/", "force-page:/"],
    ])("normalizes %s to %s", (path, expected) => {
      expect(tagFor(path)).toBe(expected)
    })

    it.each([
      ["a relative path", "feature/foo"],
      ["a path with a comma", "/artist/a,b"],
      ["a path with a space", "/artist/a b"],
      ["a path that is too long", `/${"a".repeat(1024)}`],
    ])("returns null for %s", (_label, path) => {
      expect(tagFor(path)).toBeNull()
    })

    it("returns null without the header", () => {
      expect(getPageTag(new Request("https://example.com"))).toBeNull()
    })
  })
})
