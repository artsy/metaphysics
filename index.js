// @ts-check

import Bluebird from "bluebird"
import newrelic from "artsy-newrelic"
import xapp from "artsy-xapp"
import cors from "cors"
import morgan from "artsy-morgan"
import express from "express"
import forceSSL from "express-force-ssl"
import session from "express-session"
import graphqlHTTP from "express-graphql"
import bodyParser from "body-parser"
import schema from "./schema"
import legacyLoaders from "./lib/loaders/legacy"
import createLoaders from "./lib/loaders"
import config from "./config"
import { info, error } from "./lib/loggers"
import auth from "./lib/auth"
import graphqlErrorHandler from "./lib/graphql-error-handler"
import moment from "moment"
import * as tz from "moment-timezone" // eslint-disable-line no-unused-vars
global.Promise = Bluebird

const { PORT, NODE_ENV, GRAVITY_API_URL, GRAVITY_ID, GRAVITY_SECRET } = process.env

const app = express()
const port = PORT || 3000
const sess = {
  secret: GRAVITY_SECRET,
  cookie: {},
}

app.use(newrelic)

if (NODE_ENV === "production") {
  app.set("forceSSLOptions", { trustXFPHeader: true }).use(forceSSL)
  app.set("trust proxy", 1)
  sess.cookie.secure = true
}

app.use(session(sess))

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

app.get("/favicon.ico", (req, res) => {
  res
    .status(200)
    .set({ "Content-Type": "image/x-icon" })
    .end()
})

app.all("/graphql", (req, res) => res.redirect("/"))
auth(app)

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
        ...createLoaders(accessToken, userID),
      },
      formatError: graphqlErrorHandler(request.body),
    }
  })
)

app.listen(port, () => info(`Listening on ${port}`))
