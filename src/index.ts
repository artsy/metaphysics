/* eslint-disable no-console */
import { graphqlTimeoutMiddleware } from "lib/graphqlTimeoutMiddleware"
import { applyMiddleware as applyGraphQLMiddleware } from "graphql-middleware"
import bodyParser from "body-parser"
import config from "./config"
import cors from "cors"
import { createLoaders } from "./lib/loaders"
import depthLimit from "graphql-depth-limit"
import express from "express"
import { schema as schemaV2 } from "./schema/v2"
import moment from "moment-timezone"
import morgan from "@artsy/morgan"
import { fetchPersistedQuery } from "./lib/fetchPersistedQuery"
import {
  fetchLoggerSetup,
  fetchLoggerRequestDone,
} from "lib/loaders/api/extensionsLogger"
import { info } from "./lib/loggers"
import {
  executableExchangeSchema,
  legacyTransformsForExchange,
} from "./lib/stitching/exchange/schema"
import {
  middleware as requestIDsAdder,
  requestIPAddress,
} from "./lib/requestIDs"
import { nameOldEigenQueries } from "./lib/modifyOldEigenQueries"
import { rateLimiterMiddleware } from "./lib/rateLimiter"
import { graphqlErrorHandler } from "./lib/graphqlErrorHandler"
import { graphqlBatchHTTPWrapper } from "react-relay-network-modern"

import { ResolverContext } from "types/graphql"
import { logQueryDetails } from "./lib/logQueryDetails"
import { NoSchemaIntrospectionCustomRule } from "lib/noSchemaIntrospectionCustomRule"
import { optionalFieldsDirectiveExtension } from "directives/optionalField/optionalFieldsDirectiveExtension"
import { principalFieldDirectiveExtension } from "directives/principleField/principalFieldDirectiveExtension"
import { principalFieldDirectiveValidation } from "directives/principleField/principalFieldDirectiveValidation"
import * as Sentry from "@sentry/node"
import { bodyParserMiddleware } from "lib/bodyParserMiddleware"
import { initilizeFeatureFlags } from "lib/featureFlags"
import { emailProviderRateLimitExtension } from "extensions/email_provider_rate_limit_extension"

// Initialize Unleash feature flags as early as possible
initilizeFeatureFlags()

const {
  ENABLE_REQUEST_LOGGING,
  LOG_QUERY_DETAILS_THRESHOLD,
  PRODUCTION_ENV,
  QUERY_DEPTH_LIMIT,
  RESOLVER_TIMEOUT_MS,
  SENTRY_PRIVATE_DSN,
  INTROSPECT_TOKEN,
} = config

const enableSentry = !!SENTRY_PRIVATE_DSN
const enableRequestLogging = ENABLE_REQUEST_LOGGING === "true"
const logQueryDetailsThreshold =
  (LOG_QUERY_DETAILS_THRESHOLD && parseInt(LOG_QUERY_DETAILS_THRESHOLD, 10)) ||
  null // null by default

function logQueryDetailsIfEnabled() {
  if (logQueryDetailsThreshold && Number.isInteger(logQueryDetailsThreshold)) {
    console.warn(
      `[FEATURE] Enabling logging of queries running past the ${logQueryDetailsThreshold} sec threshold.`
    )
    return logQueryDetails(logQueryDetailsThreshold)
  }
  // no-op
  return (_req, _res, next) => next()
}

function createExtensions(document, result, requestID, userAgent) {
  const principalFieldExtensions = principalFieldDirectiveExtension(
    document,
    result
  )

  const optionalFieldsExtensions = optionalFieldsDirectiveExtension(
    document,
    result
  )

  const requestLoggerExtensions = enableRequestLogging
    ? fetchLoggerRequestDone(requestID, userAgent)
    : {}

  // Should this introspect xapp token/roles for `email_provider` instead?
  const isEmailProviderRequest = userAgent.includes("Braze")
  const emailProviderExtensions = isEmailProviderRequest
    ? emailProviderRateLimitExtension(document, result)
    : {}

  const extensions = {
    ...optionalFieldsExtensions,
    ...principalFieldExtensions,
    ...requestLoggerExtensions,
    ...emailProviderExtensions,
  }

  // Instead of an empty hash, which will include `extensions: {}`
  // in all responses, make sure to return undefined.
  return Object.keys(extensions).length ? extensions : undefined
}

const app = express()
let schema = schemaV2 // use `let` in order to apply some GraphQL middleware conditionally

if (RESOLVER_TIMEOUT_MS > 0) {
  console.warn("[FEATURE] Enabling resolver timeouts")
  schema = applyGraphQLMiddleware(
    schemaV2,
    graphqlTimeoutMiddleware(RESOLVER_TIMEOUT_MS)
  )
}

if (enableSentry) {
  Sentry.init({
    dsn: SENTRY_PRIVATE_DSN,
  })
  app.use(Sentry.Handlers.requestHandler())
}

app.use(requestIDsAdder)
if (PRODUCTION_ENV) {
  app.set("trust proxy", true)
}

app.use(
  "/v2",
  cors({
    maxAge: 600,
  }),
  morgan,
  // The body parser middleware is needed for integration tests that use this file directly,
  // even though it is also included in the root index.js file.
  bodyParserMiddleware,
  rateLimiterMiddleware,
  // Ensure this divider is logged before both fetchPersistedQuery and graphqlHTTP
  (_req, _res, next) => {
    info("----------")
    next()
  },
  logQueryDetailsIfEnabled(),
  nameOldEigenQueries,
  fetchPersistedQuery
)

const exchangeSchema = executableExchangeSchema(legacyTransformsForExchange)

const graphqlHTTP = require("express-graphql")
const graphqlServer = graphqlHTTP((req, res, params) => {
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

  const ipAddress = requestIPAddress(req)

  const { requestIDs } = res.locals
  const requestID = requestIDs.requestID

  if (enableRequestLogging) {
    fetchLoggerSetup(requestID)
  }

  // Accepts a tz database timezone string. See http://www.iana.org/time-zones,
  // https://en.wikipedia.org/wiki/List_of_tz_database_time_zones
  let defaultTimezone
  if (timezone && moment.tz.zone(timezone)) {
    defaultTimezone = timezone
  }

  // Currently the xImpersonateUserID is only used for Braze purposes
  const userID = xUserID || xImpersonateUserID

  const loaders = createLoaders(accessToken, userID, {
    requestIDs,
    userAgent,
    appToken,
    xOriginalSessionID,
    isMutation: !!req.body?.query?.includes("mutation"),
    xImpersonateUserID,
  })

  const context: ResolverContext = {
    accessToken,
    userID,
    defaultTimezone,
    ...loaders,
    // For stitching purposes
    exchangeSchema,
    requestIDs,
    userAgent,
    appToken,
    ipAddress,
    xImpersonateUserID,
  }

  const validationRules = [
    principalFieldDirectiveValidation,

    // require Authorization header for introspection (in production if configured)
    ...(INTROSPECT_TOKEN &&
    req.headers["authorization"] !== `Bearer ${INTROSPECT_TOKEN}`
      ? [NoSchemaIntrospectionCustomRule]
      : []),
  ]
  if (QUERY_DEPTH_LIMIT) validationRules.push(depthLimit(QUERY_DEPTH_LIMIT))

  return {
    schema,
    graphiql: !PRODUCTION_ENV,
    context,
    rootValue: {},
    customFormatErrorFn: graphqlErrorHandler(enableSentry, {
      req,
      // Why the checking on params? Do we reach this code if params is falsy?
      variables: params && params.variables,
      query: (params && params.query)!,
    }),
    validationRules,
    extensions: ({ document, result }) =>
      createExtensions(document, result, requestID, userAgent),
  }
})

app.use("/batch", bodyParser.json(), graphqlBatchHTTPWrapper(graphqlServer))

// This is mounted at '/v2' and matches all routes that start with '/v2'.
//
// We only want to support:
//   - POSTs -> requests to '/v2'
//   - GETs:
//     - requests to '/v2' (loads GraphiQL in non-prod mode)
//     - requests to '/v2?query=...' (runs a query)
export const supportedV2RouteHandler = (req, res, next, server) => {
  if (req.method === "POST") {
    if (!["/", "/?"].includes(req.url)) return next()
  } else if (req.method === "GET") {
    if (req.url !== "/") {
      if (!req.url.startsWith("/?")) return next()
      if (!req.query.query) return next()
    }
  } else {
    return next()
  }

  return server(req, res, next)
}

// Middleware that must be mounted on our GraphQL route _before_
// our regular GraphQL handler. This is so we can register a new `res.end`
// method that will intercept the response and check if any email provider
// rate limting occurred.
//
// If so, we return a 429 status code and a JSON error message.
app.use("/v2", function (req, res, next) {
  const userAgent = req.headers["user-agent"] || ""
  if (!userAgent.includes("Braze")) {
    return next()
  }

  const originalEnd = res.end

  res.end = function (...args) {
    res.end = originalEnd
    const [chunk, encoding, cb] = args

    const contentType = res.get("content-type") || "text/html"

    if (contentType.indexOf("application/json") === 0) {
      const response = JSON.parse(chunk)

      if (response.extensions && response.extensions.emailProviderLimited) {
        res.status(429).json({ error: "rate limit reached, try again later" })
      } else {
        res.end(chunk, encoding, cb)
      }
    } else {
      res.end(chunk, encoding, cb)
    }
  }

  return next()
})

app.use("/v2", (req, res, next) => {
  supportedV2RouteHandler(req, res, next, graphqlServer)
})

app.use("*", (_req, res, _next) => {
  res.status(404).send("Please use /v2 for all queries.")
})

if (enableSentry) {
  app.use(Sentry.Handlers.errorHandler())
}

export default app
