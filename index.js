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
import schema from "./schema"
import legacyLoaders from "./lib/loaders/legacy"
import createLoaders from "./lib/loaders"
import config from "./config"
import { info, error } from "./lib/loggers"
import graphqlErrorHandler from "./lib/graphql-error-handler"
import moment from "moment"
import "moment-timezone"
import uuid from "uuid/v1"

global.Promise = Bluebird

const { PORT, NODE_ENV, GRAVITY_API_URL, GRAVITY_ID, GRAVITY_SECRET, QUERY_DEPTH_LIMIT } = process.env

const app = express()
const port = PORT || 3000
const queryLimit = parseInt(QUERY_DEPTH_LIMIT, 10) || 10 // Default to ten.
const isProduction = NODE_ENV === "production"

if (isProduction) {
  app.set("forceSSLOptions", { trustXFPHeader: true }).use(forceSSL)
  app.set("trust proxy", 1)
} else {
  global.requestInfoCache = {}
}

const extensions = isProduction ? undefined : () => global.requestInfoCache

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
  () => (config.GRAVITY_XAPP_TOKEN = xapp.token)
)

app.get("/favicon.ico", (_req, res) => {
  res
    .status(200)
    .set({ "Content-Type": "image/x-icon" })
    .end()
})

app.all("/graphql", (_req, res) => res.redirect("/"))

app.use(bodyParser.json())
app.use(
  "/",
  cors(),
  morgan,
  graphqlHTTP(request => {
    info("----------")

    legacyLoaders.clearAll()

    const accessToken = request.headers["x-access-token"]
    const userID = request.headers["x-user-id"]
    const timezone = request.headers["x-timezone"]
    const requestID = request.headers["x-request-id"] || uuid()

    // Accepts a tz database timezone string. See http://www.iana.org/time-zones,
    // https://en.wikipedia.org/wiki/List_of_tz_database_time_zones
    let defaultTimezone
    if (moment.tz.zone(timezone)) {
      defaultTimezone = timezone
    }

    return {
      schema,
      graphiql: true,
      rootValue: {
        accessToken,
        userID,
        defaultTimezone,
        ...createLoaders(accessToken, userID, requestID),
      },
      formatError: graphqlErrorHandler(request.body),
      validationRules: [depthLimit(queryLimit)],
      extensions,
    }
  })
)

app.listen(port, () => info(`Listening on ${port}`))
