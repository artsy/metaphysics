/// <reference types="@cloudflare/workers-types" />

export default {
  async fetch(request, env, ctx) {
    const cacheKeyGeneration = env.CACHE_KEY_GENERATION || "v1"
    const defaultMaxAge = env.DEFAULT_MAX_AGE || 30

    // Returns a SHA-256 digest of provided string.
    async function sha256(message) {
      // encode as UTF-8
      const msgBuffer = await new TextEncoder().encode(message)

      // hash the message
      const hashBuffer = await crypto.subtle.digest("SHA-256", msgBuffer)

      // convert bytes to hex string
      return [...new Uint8Array(hashBuffer)]
        .map((b) => b.toString(16).padStart(2, "0"))
        .join("")
    }

    // Construct a GET request with digest appended to path, to serve as cache key.
    async function getCacheKey(request) {
      const body = await request.clone().text()
      const hash = await sha256(body)
      const cacheUrl = new URL(request.url)

      cacheUrl.pathname = `${cacheUrl.pathname}_post_${cacheKeyGeneration}${hash}`

      console.log(
        "Using cache key path: ",
        cacheUrl.pathname,
        "body: ",
        body.substring(0, 100),
        "x-relay-cache-path: ",
        request.headers.get("x-relay-cache-path")
      ) // DEBUG

      return new Request(cacheUrl.toString(), {
        headers: request.headers,
        method: "GET",
      })
    }

    function getMaxAgeFromRequest(request) {
      try {
        const cacheControl = request.headers.get("cache-control")

        if (cacheControl?.includes("max-age=")) {
          console.log("Cache-Control: ", cacheControl) // DEBUG

          const directives = cacheControl
            .toLowerCase()
            .split(",")
            .map(function (directive) {
              return directive.trim().split("=")
            })

          return directives
            ?.find(function (arr) {
              return arr[0] == "max-age"
            })
            ?.at(1)
        }
        return null
      } catch (e) {
        return null
      }
    }

    try {
      if (
        !request.headers.get("cache-control")?.includes("no-cache") &&
        !request.headers.has("x-access-token") &&
        request.method.toUpperCase() === "POST"
      ) {
        const cacheKey = await getCacheKey(request)

        // @ts-ignore
        const cache = caches.default

        // Find the cache key in the cache
        const cachedResponse = await cache.match(cacheKey)
        const maxAge = getMaxAgeFromRequest(request) || defaultMaxAge
        let response

        if (cachedResponse) {
          console.log("Cache hit.") // DEBUG

          response = new Response(cachedResponse.body, cachedResponse)
          response.headers.set("Cache-Control", `max-age=${maxAge}`)
        } else {
          console.log("Cache miss. Fetching from origin...") // DEBUG

          const originResponse = await fetch(request)

          if (
            originResponse.status >= 300 ||
            originResponse.headers.get("cache-control")?.includes("no-cache")
          ) {
            return originResponse
          }

          response = new Response(originResponse.body, originResponse)
          response.headers.set("Cache-Control", `max-age=${maxAge}`)
          ctx.waitUntil(cache.put(cacheKey, response.clone()))
        }
        return response
      }

      return fetch(request)
    } catch (e) {
      return new Response("Error thrown " + e.message)
    }
  },
}
