/* eslint-disable no-console */
import { graphqlTimeoutMiddleware } from "lib/graphqlTimeoutMiddleware"
import { applyMiddleware as applyGraphQLMiddleware } from "graphql-middleware"

import bodyParser from "body-parser"
import config from "./config"
import cors from "cors"
import createLoaders from "./lib/loaders"
import depthLimit from "graphql-depth-limit"
import express from "express"
import { graphqlErrorHandler } from "./lib/graphqlErrorHandler"
import graphqlHTTP from "express-graphql"
import localSchema from "./schema"
import moment from "moment"
import morgan from "artsy-morgan"
import raven from "raven"
import xapp from "artsy-xapp"
import crunchInterceptor from "./lib/crunchInterceptor"
import {
  fetchLoggerSetup,
  fetchLoggerRequestDone,
} from "lib/loaders/api/logger"
import { fetchPersistedQuery } from "./lib/fetchPersistedQuery"
import { info } from "./lib/loggers"
import {
  executableExchangeSchema,
  legacyTransformsForExchange,
} from "./lib/stitching/exchange/schema"
import { middleware as requestIDsAdder } from "./lib/requestIDs"
import { nameOldEigenQueries } from "./lib/modifyOldEigenQueries"
import { rateLimiter } from "./lib/rateLimiter"

import { logQueryDetails } from "./lib/logQueryDetails"
import { ResolverContext } from "types/graphql"

const {
  ENABLE_REQUEST_LOGGING,
  ENABLE_HEAPDUMPS,
  LOG_QUERY_DETAILS_THRESHOLD,
  PRODUCTION_ENV,
  QUERY_DEPTH_LIMIT,
  RESOLVER_TIMEOUT_MS,
  SENTRY_PRIVATE_DSN,
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

async function startApp() {
  const app = express()

  config.GRAVITY_XAPP_TOKEN = xapp.token

  let schema = localSchema

  const exchangeSchema = await executableExchangeSchema(
    legacyTransformsForExchange
  )

  if (RESOLVER_TIMEOUT_MS > 0) {
    console.warn("[FEATURE] Enabling resolver timeouts")
    schema = applyGraphQLMiddleware(
      schema,
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
    "/",
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
    crunchInterceptor,
    graphqlHTTP((req, res, params) => {
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

      // Share with e.g. the Convection ApolloLink in mergedSchema.
      res.locals.dataLoaders = loaders
      res.locals.accessToken = accessToken

      // Supply userAgent for analytics
      res.locals.userAgent = userAgent

      const context: ResolverContext = {
        accessToken,
        userID,
        defaultTimezone,
        exchangeSchema,
        ...loaders,
      }

      return {
        schema,
        graphiql: true,
        context,
        formatError: graphqlErrorHandler(enableSentry, {
          req,
          // Why the checking on params? Do we reach this code if params is falsy?
          variables: params && params.variables,
          query: (params && params.query)!,
        }),
        validationRules: QUERY_DEPTH_LIMIT
          ? [depthLimit(QUERY_DEPTH_LIMIT)]
          : null,
        extensions: enableRequestLogging
          ? fetchLoggerRequestDone(requestID)
          : undefined,
      }
    })
  )

  if (enableSentry) {
    app.use(raven.errorHandler())
  }

  return app
}

let startedApp: express.Express

export default async (req, res, next) => {
  try {
    if (!startedApp) {
      startedApp = await startApp()
    }
    startedApp(req, res, next)
  } catch (err) {
    next(err)
  }
}
