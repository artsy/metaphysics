import RateLimit from "express-rate-limit"
import MemcachedStore from "rate-limit-memcached"
import { client } from "./cache"
import { Request } from "express"
import config from "../config"

// We expect our own services to include DataDog headers.
export const skip = (req: Request) => !!req.headers["x-datadog-trace-id"]

// Wrap `RateLimit` with a timeout. This helps in the case of
// slow memcache responses. We see those in production, and the
// underlying memcache client can sometimes hang. It's good to
// wrap cache access with a timeout to avoid this.
export const rateLimiterMiddleware = async (req, res, next) => {
  try {
    await new Promise((resolve, reject) => {
      // Timeout handler, will reject if hit.
      let timeoutId: NodeJS.Timer | null = setTimeout(() => {
        timeoutId = null
        const error = new Error(
          `Timeout of ${config.CACHE_RETRIEVAL_TIMEOUT_MS}ms, skipping...`
        )
        reject(error)
      }, config.CACHE_RETRIEVAL_TIMEOUT_MS)
      const resetTimer = () => {
        if (timeoutId) clearTimeout(timeoutId)
      }

      // Handlers for a rate limit being hit or not.
      const rateLimitHit = () => {
        resetTimer()
        res.status(429).send("Too many requests, please try again later.")
      }

      const requestAllowed = () => {
        resetTimer()
        resolve()
      }

      new RateLimit({
        max: config.RATE_LIMIT_MAX,
        skip,
        windowMs: config.RATE_LIMIT_WINDOW_MS,
        // statusCode: 500, // In case we don’t want to inform the offender
        store: new MemcachedStore({
          client,
          prefix: "limit-ip:",
          expiration: config.RATE_LIMIT_WINDOW_MS / 1000,
        }),
        handler: rateLimitHit,
      })(req, res, requestAllowed)
    })
  } catch (e) {
    console.log(`[Rate Limiter]: ${e.message}`)
  } finally {
    // If the request is allowed, or if the cache is down/times out
    // and an error is thrown, we will end up here, so we always want
    // to call `next()`.
    next()
  }
}
