import cors from "cors"
import createLoaders from "./lib/loaders"
import depthLimit from "graphql-depth-limit"
import express from "express"
import graphqlErrorHandler from "./lib/graphql-error-handler"
import graphqlHTTP from "express-graphql"
import legacyLoaders from "./lib/loaders/legacy"
import localSchema from "./schema"
import moment from "moment"
import morgan from "artsy-morgan"
import {
  fetchLoggerSetup,
  fetchLoggerRequestDone,
} from "lib/loaders/api/logger"
import { info } from "./lib/loggers"
import { mergeSchemas } from "./lib/mergeSchemas"
import { middleware as requestIDsAdder } from "./lib/requestIDs"
import { middleware as requestTracer, makeSchemaTraceable } from "./lib/tracer"

const {
  ENABLE_QUERY_TRACING,
  ENABLE_SCHEMA_STITCHING,
  NODE_ENV,
  QUERY_DEPTH_LIMIT,
} = process.env
const isProduction = NODE_ENV === "production"
const queryLimit = (QUERY_DEPTH_LIMIT && parseInt(QUERY_DEPTH_LIMIT, 10)) || 10 // Default to ten.
const enableSchemaStitching = ENABLE_SCHEMA_STITCHING === "true"
const enableQueryTracing = ENABLE_QUERY_TRACING === "true"

const app = express()

async function startApp() {
  let schema = localSchema

  if (enableSchemaStitching) {
    try {
      schema = await mergeSchemas()
    } catch (error) {
      console.log("Error merging schemas:", error) // eslint-disable-line
    }
  }

  if (enableQueryTracing) {
    console.warn("[FEATURE] Enabling query tracing") // eslint-disable-line
    makeSchemaTraceable(schema)
    app.use(requestTracer)
  }

  app.use(requestIDsAdder)

  app.use(
    "/",
    cors(),
    morgan,
    graphqlHTTP((req, res) => {
      info("----------")

      legacyLoaders.clearAll()

      const accessToken = req.headers["x-access-token"]
      const userID = req.headers["x-user-id"]
      const timezone = req.headers["x-timezone"]

      const { requestIDs, span } = res.locals
      const requestID = requestIDs.requestID

      if (!isProduction) {
        fetchLoggerSetup(requestID)
      }

      // Accepts a tz database timezone string. See http://www.iana.org/time-zones,
      // https://en.wikipedia.org/wiki/List_of_tz_database_time_zones
      let defaultTimezone
      if (moment.tz.zone(timezone)) {
        defaultTimezone = timezone
      }

      const loaders = createLoaders(accessToken, userID, requestID)
      // Share with e.g. the Convection ApolloLink in mergedSchema.
      res.locals.dataLoaders = loaders // eslint-disable-line no-param-reassign

      return {
        schema,
        graphiql: true,
        rootValue: {
          accessToken,
          userID,
          defaultTimezone,
          span,
          ...createLoaders(accessToken, userID, requestIDs),
        },
        formatError: graphqlErrorHandler(req.body),
        validationRules: [depthLimit(queryLimit)],
        extensions: isProduction
          ? undefined
          : fetchLoggerRequestDone(requestID),
      }
    })
  )
}

startApp()
export default app
