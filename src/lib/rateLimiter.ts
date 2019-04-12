import RateLimit from "express-rate-limit"
import MemcachedStore from "rate-limit-memcached"
import { _client } from "./cache"
import { Request } from "express"
import config from "../config"

// We expect our own services to include DataDog headers.
export const skip = (req: Request) => !!req.headers["x-datadog-trace-id"]

export const rateLimiter = new RateLimit({
  max: config.RATE_LIMIT_MAX,
  skip,
  windowMs: config.RATE_LIMIT_WINDOW_MS,
  // statusCode: 500, // In case we don’t want to inform the offender
  store: new MemcachedStore({
    client: _client,
    prefix: "limit-ip:",
    expiration: config.RATE_LIMIT_WINDOW_MS / 1000,
  }),
})
