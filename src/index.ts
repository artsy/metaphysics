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
import { createYoga, Plugin } from "graphql-yoga"

import { ResolverContext } from "types/graphql"
import { logQueryDetails } from "./lib/logQueryDetails"
import { NoSchemaIntrospectionCustomRule } from "lib/noSchemaIntrospectionCustomRule"
import { optionalFieldsDirectiveExtension } from "directives/optionalField/optionalFieldsDirectiveExtension"
import { principalFieldDirectiveExtension } from "directives/principalField/principalFieldDirectiveExtension"
import { principalFieldDirectiveValidation } from "directives/principalField/principalFieldDirectiveValidation"
import * as Sentry from "@sentry/node"
import { bodyParserMiddleware } from "lib/bodyParserMiddleware"
import { initializeFeatureFlags } from "lib/featureFlags"

// Initialize Unleash feature flags as early as possible
initializeFeatureFlags()

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

  const extensions = {
    ...optionalFieldsExtensions,
    ...principalFieldExtensions,
    ...requestLoggerExtensions,
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
  // Ensure this divider is logged before both fetchPersistedQuery and the GraphQL handler
  (_req, _res, next) => {
    info("----------")
    next()
  },
  logQueryDetailsIfEnabled(),
  nameOldEigenQueries,
  fetchPersistedQuery
)

const exchangeSchema = executableExchangeSchema(legacyTransformsForExchange)

// Internal context fields used by the plugins below — prefixed `_` to avoid
// colliding with real resolver context keys.
type YogaInternalContext = ResolverContext & {
  _requestID: string
  _userAgent?: string
  _req: express.Request
  _params?: { query?: string; variables?: Record<string, any> }
}

type YogaServerContext = { req: express.Request; res: express.Response }

// Adds validation rules per-request. onValidate runs before onContextBuilding,
// so the user context isn't built yet — read `req` from the server context.
const validationRulesPlugin: Plugin<YogaInternalContext, YogaServerContext> = {
  onValidate({ context, addValidationRule }) {
    addValidationRule(principalFieldDirectiveValidation)
    const req = ((context as unknown) as YogaServerContext).req
    if (
      INTROSPECT_TOKEN &&
      req.headers["authorization"] !== `Bearer ${INTROSPECT_TOKEN}`
    ) {
      addValidationRule(NoSchemaIntrospectionCustomRule)
    }
    if (QUERY_DEPTH_LIMIT) {
      addValidationRule(depthLimit(QUERY_DEPTH_LIMIT))
    }
  },
}

// The `Viewer` type's resolver returns rootValue (see src/schema/v2/schema.ts).
// Without a non-null rootValue, every `viewer { ... }` query resolves to null.
const rootValuePlugin: Plugin<YogaInternalContext, YogaServerContext> = {
  onExecute({ args }) {
    args.rootValue = {}
  },
}

// Merges our computed extensions (principalField, optionalFields, request
// logger) onto the final result after execute.
const extensionsPlugin: Plugin<YogaInternalContext, YogaServerContext> = {
  onExecute() {
    return {
      onExecuteDone({ args, result, setResult }) {
        if (
          "initialResult" in (result as any) ||
          !("data" in (result as any))
        ) {
          return
        }
        const ctx = args.contextValue as YogaInternalContext
        const extensions = createExtensions(
          args.document,
          result,
          ctx._requestID,
          ctx._userAgent
        )
        if (extensions) {
          setResult({
            ...(result as any),
            extensions: {
              ...((result as any).extensions ?? {}),
              ...extensions,
            },
          })
        }
      },
    }
  },
}

// Runs every GraphQL error through `graphqlErrorHandler` (Sentry reporting,
// stack inclusion in dev, httpStatusCodes extension). Yoga's default error
// masking is disabled in the config below so the handler sees real errors.
const errorFormatPlugin: Plugin<YogaInternalContext, YogaServerContext> = {
  onExecutionResult({ result, setResult, context }) {
    if (!result || "initialResult" in (result as any)) return
    const r = result as any
    if (!r.errors?.length) return
    // onExecutionResult receives Yoga's server context (req/res + params from
    // YogaInitialContext), not the user-built context.
    const ctx = (context as unknown) as YogaServerContext & {
      params?: { query?: string; variables?: Record<string, any> }
    }
    // Prevent CDNs from caching responses that contain errors.
    ctx.res.setHeader("Cache-Control", "no-cache")
    const handler = graphqlErrorHandler(enableSentry, {
      req: ctx.req,
      variables: ctx.params?.variables,
      // eslint-disable-next-line @typescript-eslint/no-non-null-asserted-optional-chain
      query: ctx.params?.query!,
    })
    setResult({ ...r, errors: r.errors.map((e: any) => handler(e)) })
  },
}

const yoga = createYoga<YogaServerContext, YogaInternalContext>({
  schema,
  graphqlEndpoint: "/v2",
  graphiql: !PRODUCTION_ENV,
  maskedErrors: false,
  // Client-side batching is handled by graphqlBatchHTTPWrapper below, which
  // invokes this handler once per batched operation.
  batching: false,
  landingPage: false,
  // Clients include `id` alongside `query`
  // `fetchPersistedQuery` leaves `documentID` on the body after resolving it
  extraParamNames: ["id", "documentID"],
  context: ({ req, res, params }) => {
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
    const ipAddress = requestIPAddress(req)

    const { requestIDs } = res.locals
    const requestID = requestIDs.requestID

    if (enableRequestLogging) {
      fetchLoggerSetup(requestID)
    }

    let defaultTimezone
    if (timezone && moment.tz.zone(timezone)) {
      defaultTimezone = timezone
    }

    const userID = xUserID || xImpersonateUserID

    const loaders = createLoaders(accessToken, userID, {
      requestIDs,
      userAgent,
      appToken,
      xOriginalSessionID,
      isMutation: !!req.body?.query?.includes("mutation"),
      xImpersonateUserID,
    })

    const context: YogaInternalContext = {
      accessToken,
      userID,
      defaultTimezone,
      ...loaders,
      exchangeSchema,
      requestIDs,
      userAgent,
      appToken,
      ipAddress,
      xImpersonateUserID,
      isCMSRequest,
      _req: req,
      _requestID: requestID,
      _userAgent: userAgent,
      _params: params,
    }

    return context
  },
  plugins: [
    validationRulesPlugin,
    rootValuePlugin,
    extensionsPlugin,
    errorFormatPlugin,
  ],
})

// Adapter: graphqlBatchHTTPWrapper and supportedV2RouteHandler expect an
// Express-style `(req, res, next)` middleware. Yoga is a `(req, res)` handler
// that writes the response itself, so we forward errors to `next`.
const yogaExpressMiddleware: express.RequestHandler = (req, res, next) => {
  Promise.resolve(yoga.handle(req as any, res as any, { req, res })).catch(next)
}

app.use(
  "/batch",
  bodyParser.json(),
  graphqlBatchHTTPWrapper(yogaExpressMiddleware as any)
)

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

app.use("/v2", (req, res, next) => {
  supportedV2RouteHandler(req, res, next, yogaExpressMiddleware)
})

app.use("*", (_req, res, _next) => {
  res.status(404).send("Please use /v2 for all queries.")
})

if (enableSentry) {
  app.use(Sentry.Handlers.errorHandler())
}

export default app
