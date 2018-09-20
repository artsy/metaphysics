import RateLimit from "express-rate-limit"
import MemcachedStore from "rate-limit-memcached"
import { client } from "./cache"
import { Request } from "express"

// Max 100 requests in 15 minutes from a single IP
const max = 100
const expiration = 15 * 60

export const skip = (req: Request) =>
  (req.headers["x-forwarded-for"] &&
    (req.headers["x-forwarded-for"] as string).split(",").length > 1) ||
  (req.body.query &&
    !req.body.query.includes("routes_OverviewQueryRendererQuery"))

export const rateLimiter = new RateLimit({
  max,
  skip,
  windowMs: expiration * 1000,
  // statusCode: 500, // In case we don’t want to inform the offender
  store: new MemcachedStore({ expiration, client, prefix: "limit-ip:" }),
})
