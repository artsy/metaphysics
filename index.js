// @ts-check

import Bluebird from "bluebird"
import "artsy-newrelic"
import xapp from "artsy-xapp"
import cors from "cors"
import depthLimit from "graphql-depth-limit"
import morgan from "artsy-morgan"
import express from "express"
import forceSSL from "express-force-ssl"
import graphqlHTTP from "express-graphql"
import bodyParser from "body-parser"
import { mergeSchemas } from "./lib/mergeSchemas"
import legacyLoaders from "./lib/loaders/legacy"
import createLoaders from "./lib/loaders"
import config from "./config"
import { info, error } from "./lib/loggers"
import graphqlErrorHandler from "./lib/graphql-error-handler"
import moment from "moment"
import "moment-timezone"
import { fetchLoggerSetup, fetchLoggerRequestDone } from "lib/loaders/api/logger"
import { middleware as requestTracer, makeSchemaTraceable } from "./lib/tracer"
import { middleware as requestIDsAdder } from "./lib/requestIDs"

global.Promise = Bluebird

const { PORT, NODE_ENV, GRAVITY_API_URL, GRAVITY_ID, GRAVITY_SECRET, QUERY_DEPTH_LIMIT } = process.env

const app = express()
const port = PORT || 3000
const queryLimit = (QUERY_DEPTH_LIMIT && parseInt(QUERY_DEPTH_LIMIT, 10)) || 10 // Default to ten.
const isProduction = NODE_ENV === "production"

function startApp(schema) {
  if (isProduction) {
    app.set("forceSSLOptions", { trustXFPHeader: true }).use(forceSSL)
    app.set("trust proxy", 1)
  }

  app.get("/favicon.ico", (_req, res) => {
    res
      .status(200)
      .set({ "Content-Type": "image/x-icon" })
      .end()
  })

  app.all("/graphql", (_req, res) => res.redirect("/"))

  app.use(bodyParser.json())

  if (!isProduction) {
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

      const { requestIDs, span, finishedSpans } = res.locals
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
          finishedSpans,
          ...createLoaders(accessToken, userID, requestIDs),
        },
        formatError: graphqlErrorHandler(req.body),
        validationRules: [depthLimit(queryLimit)],
        extensions: isProduction ? undefined : fetchLoggerRequestDone(requestID),
      }
    })
  )

  app.listen(port, () => info(`Listening on ${port}`))
}

xapp.on("error", err => {
  error(err)
  process.exit()
})

xapp.init(
  {
    url: GRAVITY_API_URL,
    id: GRAVITY_ID,
    secret: GRAVITY_SECRET,
  },
  () => {
    config.GRAVITY_XAPP_TOKEN = xapp.token
    mergeSchemas().then(startApp)
  }
)
