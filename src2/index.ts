import { createYoga } from "graphql-yoga"
import cors from "cors"
import express from "express"
import moment from "moment-timezone"
import morgan from "@artsy/morgan"
import config from "./config"
import { resolveArtnetEnv } from "./lib/artnetEnv"
import { bodyParserMiddleware } from "./lib/bodyParserMiddleware"
import { createLoaders } from "./lib/loaders"
import { info } from "./lib/loggers"
import { rateLimiterMiddleware } from "./lib/rateLimiter"
import {
  middleware as requestIDsAdder,
  requestIPAddress,
} from "./lib/requestIDs"
import { schema } from "./schema"
import { ResolverContext } from "types/graphql"

const { PRODUCTION_ENV } = config

const app = express()

app.use(requestIDsAdder)
if (PRODUCTION_ENV) {
  app.set("trust proxy", true)
}

app.use(
  "/v2",
  cors({ maxAge: 600 }),
  morgan,
  bodyParserMiddleware,
  rateLimiterMiddleware,
  (_req, _res, next) => {
    info("----------")
    next()
  }
)

type YogaServerContext = { req: express.Request; res: express.Response }

const yoga = createYoga<YogaServerContext, ResolverContext>({
  schema,
  graphqlEndpoint: "/v2",
  graphiql: !PRODUCTION_ENV,
  maskedErrors: false,
  batching: false,
  landingPage: false,
  context: ({ req, res }) => {
    const accessToken = req.headers["x-access-token"] as string | undefined
    const appToken = req.headers["x-xapp-token"] as string | undefined
    const xUserID = req.headers["x-user-id"] as string | undefined
    const xOriginalSessionID = req.headers["x-original-session-id"] as
      | string
      | undefined
    const timezone = req.headers["x-timezone"] as string | undefined
    const userAgent = req.headers["user-agent"]
    const xImpersonateUserID = req.headers["x-impersonate-user-id"] as
      | string
      | undefined
    const isCMSRequest = req.headers["x-cms-request"] === "true"
    const xArtnetToken = req.headers["x-artnet-token"] as string | undefined
    const xArtnetUserID = req.headers["x-artnet-user-id"] as string | undefined

    const xArtnetEnv = req.headers["x-artnet-env"] as string | undefined
    // Resolved lazily so that an invalid header only fails Artnet queries
    const artnetEnv = () =>
      resolveArtnetEnv({ artnetEnv: xArtnetEnv, host: req.headers.host })

    const { requestIDs } = res.locals

    const userID = xUserID || xImpersonateUserID

    const loaders = createLoaders(accessToken, userID, {
      requestIDs,
      userAgent,
      appToken,
      xOriginalSessionID,
      isMutation: !!req.body?.query?.includes("mutation"),
      xImpersonateUserID,
      xArtnetToken,
      xArtnetUserID,
    })

    return {
      accessToken,
      userID,
      defaultTimezone:
        timezone && moment.tz.zone(timezone) ? timezone : undefined,
      ...loaders,
      requestIDs,
      userAgent,
      appToken,
      ipAddress: requestIPAddress(req),
      xImpersonateUserID,
      isCMSRequest,
      artnetEnv,
    }
  },
})

// Yoga is a `(req, res)` handler that writes the response itself, so forward
// errors to `next`.
const yogaExpressMiddleware: express.RequestHandler = (req, res, next) => {
  Promise.resolve(yoga.handle(req as any, res as any, { req, res })).catch(next)
}

app.use("/v2", yogaExpressMiddleware)

app.use("*", (_req, res) => {
  res.status(404).send("Please use /v2 for all queries.")
})

export default app
