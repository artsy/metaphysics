/* eslint-disable no-console */

import { middleware as requestTracer, makeSchemaTraceable, tracer } from "./lib/tracer"

import bodyParser from "body-parser"
import config from "./config"
import cors from "cors"
import createLoaders from "./lib/loaders"
import depthLimit from "graphql-depth-limit"
import express from "express"
import graphqlErrorHandler from "./lib/graphqlErrorHandler"
import graphqlHTTP from "express-graphql"
import localSchema from "./schema"
import moment from "moment"
import morgan from "artsy-morgan"
import raven from "raven"
import xapp from "artsy-xapp"
import {
  fetchLoggerSetup,
  fetchLoggerRequestDone,
} from "lib/loaders/api/logger"
import { fetchPersistedQuery } from "./lib/fetchPersistedQuery"
import { info } from "./lib/loggers"
import { mergeSchemas } from "./lib/stitching/mergeSchemas"
import { executableLewittSchema } from "./lib/stitching/lewitt/schema"
import { middleware as requestIDsAdder } from "./lib/requestIDs"

import { logQueryDetails } from "./lib/logQueryDetails"

const {
  ENABLE_QUERY_TRACING,
  ENABLE_REQUEST_LOGGING,
  ENABLE_SCHEMA_STITCHING,
  LOG_QUERY_DETAILS_THRESHOLD,
  NODE_ENV,
  QUERY_DEPTH_LIMIT,
  SENTRY_PRIVATE_DSN,
} = config
const isProduction = NODE_ENV === "production"
const queryLimit = (QUERY_DEPTH_LIMIT && parseInt(QUERY_DEPTH_LIMIT, 10)) || 10 // Default to ten.
const enableSchemaStitching = ENABLE_SCHEMA_STITCHING === "true"
const enableQueryTracing = ENABLE_QUERY_TRACING === "true"
const enableSentry = !!SENTRY_PRIVATE_DSN
const enableRequestLogging = ENABLE_REQUEST_LOGGING === "true"
const logQueryDetailsThreshold =
  LOG_QUERY_DETAILS_THRESHOLD && parseInt(LOG_QUERY_DETAILS_THRESHOLD, 10) // null by default

function logQueryDetailsIfEnabled() {
  if (Number.isInteger(logQueryDetailsThreshold)) {
    console.warn(
      `[FEATURE] Enabling logging of queries running past the ${
        logQueryDetailsThreshold
      } sec threshold.`
    )
    return logQueryDetails(logQueryDetailsThreshold)
  }
  // no-op
  return (req, res, next) => next()
}

const app = express()

async function startApp() {
  config.GRAVITY_XAPP_TOKEN = xapp.token

  let schema = localSchema
  const lewittSchema = await executableLewittSchema()

  if (enableSchemaStitching) {
    try {
      console.warn("[FEATURE] Enabling Schema Stitching")
      schema = await mergeSchemas()
    } catch (err) {
      console.log("Error merging schemas:", err)
    }
  }

  //if (enableQueryTracing) {
  if (false) {
    console.warn("[FEATURE] Enabling query tracing")
    makeSchemaTraceable(schema)
    app.use(requestTracer)
  }

  app.use(requestIDsAdder)

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
    // Ensure this divider is logged before both fetchPersistedQuery and graphqlHTTP
    (req, res, next) => {
      info("----------")
      next()
    },
    logQueryDetailsIfEnabled(),
    fetchPersistedQuery,
    graphqlHTTP((req, res) => {
      const accessToken = req.headers["x-access-token"]
      const userID = req.headers["x-user-id"]
      const timezone = req.headers["x-timezone"]
      const userAgent = req.headers["user-agent"]

      const { requestIDs, span } = res.locals
      const requestID = requestIDs.requestID

      if (enableRequestLogging) {
        fetchLoggerSetup(requestID)
      }

      // Accepts a tz database timezone string. See http://www.iana.org/time-zones,
      // https://en.wikipedia.org/wiki/List_of_tz_database_time_zones
      let defaultTimezone
      if (moment.tz.zone(timezone)) {
        defaultTimezone = timezone
      }

      const loaders = createLoaders(accessToken, userID, {
        requestIDs,
        userAgent,
        span,
      })
      // Share with e.g. the Convection ApolloLink in mergedSchema.
      res.locals.dataLoaders = loaders // eslint-disable-line no-param-reassign
      res.locals.accessToken = accessToken // eslint-disable-line no-param-reassign
      return {
        schema,
        graphiql: true,
        rootValue: {
          accessToken,
          userID,
          defaultTimezone,
          span,
          lewittSchema,
          ...createLoaders(accessToken, userID, {
            requestIDs,
            userAgent,
            span,
          }),
        },
        formatError: graphqlErrorHandler(req, {
          enableSentry,
          isProduction,
        }),
        validationRules: [depthLimit(queryLimit)],
        extensions: enableRequestLogging
          ? fetchLoggerRequestDone(requestID)
          : undefined,
      }
    })
  )

  if (enableSentry) {
    app.use(raven.errorHandler())
  }
}

startApp()
export default app
