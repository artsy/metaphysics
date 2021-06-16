/* eslint-disable no-console */
import { graphqlTimeoutMiddleware } from "lib/graphqlTimeoutMiddleware"
import { applyMiddleware as applyGraphQLMiddleware } from "graphql-middleware"

import bodyParser from "body-parser"
import config from "./config"
import cors from "cors"
import { createLoaders } from "./lib/loaders"
import depthLimit from "graphql-depth-limit"
import express from "express"
import { schema as schemaV1 } from "./schema/v1"
import { schema as schemaV2 } from "./schema/v2"
import moment from "moment-timezone"
import morgan from "artsy-morgan"
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
import { middleware as requestIDsAdder } from "./lib/requestIDs"
import { nameOldEigenQueries } from "./lib/modifyOldEigenQueries"
import { rateLimiterMiddleware } from "./lib/rateLimiter"
import { graphqlErrorHandler } from "./lib/graphqlErrorHandler"
import { graphqlBatchHTTPWrapper } from "react-relay-network-modern"

import { ResolverContext } from "types/graphql"
import { logQueryDetails } from "./lib/logQueryDetails"
import { ErrorExtension } from "./extensions/errorExtension"
import { LoggingExtension } from "./extensions/loggingExtension"
import { principalFieldDirectiveExtension } from "./extensions/principalFieldDirectiveExtension"
import { principalFieldDirectiveValidation } from "validations/principalFieldDirectiveValidation"
import { NoSchemaIntrospectionCustomRule } from "validations/noSchemaIntrospectionCustomRule"
import * as Sentry from "@sentry/node"

const {
  ENABLE_REQUEST_LOGGING,
  ENABLE_HEAPDUMPS,
  LOG_QUERY_DETAILS_THRESHOLD,
  PRODUCTION_ENV,
  QUERY_DEPTH_LIMIT,
  RESOLVER_TIMEOUT_MS,
  SENTRY_PRIVATE_DSN,
  ENABLE_APOLLO,
  INTROSPECT_TOKEN,
} = config

const enableSentry = !!SENTRY_PRIVATE_DSN
const enableRequestLogging = ENABLE_REQUEST_LOGGING === "true"
const logQueryDetailsThreshold =
  (LOG_QUERY_DETAILS_THRESHOLD && parseInt(LOG_QUERY_DETAILS_THRESHOLD, 10)) ||
  null // null by default

if (ENABLE_HEAPDUMPS) {
  require("heapdump") // Request a heapdump by sending `kill -USR2 [pid of metaphysics]`
}

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

function createExtensions(document, result, requestID) {
  const principalFieldExtensions = principalFieldDirectiveExtension(
    document,
    result
  )

  const requestLoggerExtensions = enableRequestLogging
    ? fetchLoggerRequestDone(requestID)
    : {}

  const extensions = {
    ...principalFieldExtensions,
    ...requestLoggerExtensions,
  }

  // Instead of an empty hash, which will include `extensions: {}`
  // in all responses, make sure to return undefined.
  return Object.keys(extensions).length ? extensions : undefined
}

function startApp(appSchema, path: string) {
  const app = express()

  const exchangeSchema = executableExchangeSchema(legacyTransformsForExchange)

  if (RESOLVER_TIMEOUT_MS > 0) {
    console.warn("[FEATURE] Enabling resolver timeouts")
    appSchema = applyGraphQLMiddleware(
      appSchema,
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
    path,
    cors({
      maxAge: 600,
    }),
    morgan,
    // Gotta parse the JSON body before passing it to logQueryDetails/fetchPersistedQuery
    bodyParser.json(),
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

  if (ENABLE_APOLLO) {
    console.warn("[FEATURE] Enabling Apollo Server")
    const { ApolloServer } = require("apollo-server-express")
    const server = new ApolloServer({
      schema: appSchema,
      rootValue: {},
      playground: true,
      introspection: true,
      validationRules: QUERY_DEPTH_LIMIT
        ? [depthLimit(QUERY_DEPTH_LIMIT)]
        : undefined,
      extensions: [
        () => new LoggingExtension(enableRequestLogging),
        () => new ErrorExtension({ enableSentry }),
      ],
      context: ({ req, res }) => {
        const accessToken = req.headers["x-access-token"] as string | undefined
        const appToken = req.headers["x-xapp-token"] as string | undefined
        const userID = req.headers["x-user-id"] as string | undefined
        const timezone = req.headers["x-timezone"] as string | undefined
        const userAgent = req.headers["user-agent"]
        const { requestIDs } = res.locals

        // Accepts a tz database timezone string. See http://www.iana.org/time-zones,
        // https://en.wikipedia.org/wiki/List_of_tz_database_time_zones
        let defaultTimezone
        if (timezone && moment.tz.zone(timezone)) {
          defaultTimezone = timezone
        }

        const loaders = createLoaders(accessToken, userID, {
          requestIDs,
          userAgent,
          appToken,
        })

        return {
          accessToken,
          userID,
          defaultTimezone,
          ...loaders,
          // For stitching purposes
          exchangeSchema,
          requestIDs,
          userAgent,
        }
      },
    })

    server.applyMiddleware({ app, path })
  } else {
    const graphqlHTTP = require("express-graphql")
    const graphqlServer = graphqlHTTP((req, res, params) => {
      const accessToken = req.headers["x-access-token"] as string | undefined
      const appToken = req.headers["x-xapp-token"] as string | undefined
      const userID = req.headers["x-user-id"] as string | undefined
      const timezone = req.headers["x-timezone"] as string | undefined
      const userAgent = req.headers["user-agent"]

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

      const loaders = createLoaders(accessToken, userID, {
        requestIDs,
        userAgent,
        appToken,
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
        schema: appSchema,
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
          createExtensions(document, result, requestID),
      }
    })

    app.use("/batch", bodyParser.json(), graphqlBatchHTTPWrapper(graphqlServer))
    app.use(graphqlServer)
  }

  if (enableSentry) {
    app.use(Sentry.Handlers.errorHandler())
  }

  return app
}

const app = express()

// This order is important for dd-trace to be able to find the nested routes.
app.use("/v2", startApp(schemaV2, "/"))
app.use("/", startApp(schemaV1, "/"))

export default app
