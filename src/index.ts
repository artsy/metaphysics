/* eslint-disable no-console */
import { graphqlTimeoutMiddleware } from "lib/graphqlTimeoutMiddleware"
import { applyMiddleware as applyGraphQLMiddleware } from "graphql-middleware"

import bodyParser from "body-parser"
import config from "./config"
import cors from "cors"
import createLoaders from "./lib/loaders"
import depthLimit from "graphql-depth-limit"
import express from "express"
import { schema, schemaV2 } from "./schema"
import moment from "moment"
import morgan from "artsy-morgan"
import raven from "raven"
import xapp from "artsy-xapp"
import crunchInterceptor from "./lib/crunchInterceptor"
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
import { rateLimiter } from "./lib/rateLimiter"
// import { graphqlErrorHandler } from "./lib/graphqlErrorHandler"

import { ResolverContext } from "types/graphql"
import { logQueryDetails } from "./lib/logQueryDetails"
import { ErrorExtension } from "./extensions/errorExtension"
import { LoggingExtension } from "./extensions/loggingExtension"

const {
  ENABLE_REQUEST_LOGGING,
  ENABLE_HEAPDUMPS,
  LOG_QUERY_DETAILS_THRESHOLD,
  PRODUCTION_ENV,
  QUERY_DEPTH_LIMIT,
  RESOLVER_TIMEOUT_MS,
  SENTRY_PRIVATE_DSN,
  ENABLE_APOLLO,
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

function startApp(appSchema, path: string) {
  const app = express()

  config.GRAVITY_XAPP_TOKEN = xapp.token

  const exchangeSchema = executableExchangeSchema(legacyTransformsForExchange)

  if (RESOLVER_TIMEOUT_MS > 0) {
    console.warn("[FEATURE] Enabling resolver timeouts")
    appSchema = applyGraphQLMiddleware(
      appSchema,
      graphqlTimeoutMiddleware(RESOLVER_TIMEOUT_MS)
    )
  }

  app.use(requestIDsAdder)
  if (PRODUCTION_ENV) {
    app.set("trust proxy", true)
  }

  if (enableSentry) {
    raven.config(SENTRY_PRIVATE_DSN).install()
    app.use(raven.requestHandler())
  }

  app.use(
    path,
    cors(),
    morgan,
    // Gotta parse the JSON body before passing it to logQueryDetails/fetchPersistedQuery
    bodyParser.json(),
    rateLimiter,
    // Ensure this divider is logged before both fetchPersistedQuery and graphqlHTTP
    (_req, _res, next) => {
      info("----------")
      next()
    },
    logQueryDetailsIfEnabled(),
    nameOldEigenQueries,
    fetchPersistedQuery,
    crunchInterceptor
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
    app.use(
      graphqlHTTP((req, res /*, params */) => {
        console.log("Request from", path)
        const accessToken = req.headers["x-access-token"] as string | undefined
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

        return {
          schema: appSchema,
          graphiql: true,
          context,
          rootValue: {},
          // FIXME: This needs to be updated as per the release notes of graphql-js v14
          // formatError: graphqlErrorHandler(enableSentry, {
          //   req,
          //   // Why the checking on params? Do we reach this code if params is falsy?
          //   variables: params && params.variables,
          //   query: (params && params.query)!,
          // }),
          validationRules: QUERY_DEPTH_LIMIT
            ? [depthLimit(QUERY_DEPTH_LIMIT)]
            : null,
          extensions: enableRequestLogging
            ? () => fetchLoggerRequestDone(requestID)
            : undefined,
        }
      })
    )
  }

  if (enableSentry) {
    app.use(raven.errorHandler())
  }

  return app
}

export default express()
  .use("/", startApp(schema, "/"))
  .use("/", startApp(schemaV2, "/v2"))
