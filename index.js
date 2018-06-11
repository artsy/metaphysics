import "moment-timezone"
import Bluebird from "bluebird"
import xapp from "artsy-xapp"
import compression from "compression"
import express from "express"
import expressMetrics from "express-node-metrics"
import forceSSL from "express-force-ssl"
import bodyParser from "body-parser"
import { info, error } from "./src/lib/loggers"
import config from "config"

const {
  ENABLE_ASYNC_STACK_TRACES,
  ENABLE_EXPRESS_METRICS,
  GRAVITY_API_URL,
  GRAVITY_ID,
  GRAVITY_SECRET,
  NODE_ENV,
  PORT,
} = config

global.Promise = Bluebird

const port = PORT
const isDevelopment = NODE_ENV === "development"
const isProduction = NODE_ENV === "production"
const enableAsyncStackTraces = ENABLE_ASYNC_STACK_TRACES === "true"
const enableMetrics = ENABLE_EXPRESS_METRICS === "true"

if (enableAsyncStackTraces) {
  console.warn("[FEATURE] Enabling long async stack traces") // eslint-disable-line
  require("longjohn")
}

const app = express()

app.use(compression())

if (enableMetrics) {
  app.use(expressMetrics.middleware)
  app.get('/metrics', (req, res) => {
    res.send(expressMetrics.metrics.getAll())
  })
}

xapp.on("error", err => {
  error(err)
  process.exit(1)
})

const xappConfig = {
  url: GRAVITY_API_URL,
  id: GRAVITY_ID,
  secret: GRAVITY_SECRET,
}

xapp.init(xappConfig, bootApp) // eslint-disable-line

function bootApp() {
  if (isProduction) {
    app.set("forceSSLOptions", { trustXFPHeader: true }).use(forceSSL)
    app.set("trust proxy", 1)
  }

  app.use(bodyParser.json())

  app.get("/favicon.ico", (_req, res) => {
    res
      .status(200)
      .set({ "Content-Type": "image/x-icon" })
      .end()
  })

  app.all("/graphql", (_req, res) => res.redirect("/"))

  if (isDevelopment) {
    const { createReloadable } = require("@artsy/express-reloadable")
    const mountAndReload = createReloadable(app, require)
    mountAndReload("./src")
  } else {
    app.use(require("./src").default)
  }

  app.listen(port, () =>
    info(`[Metaphysics] Listening on http://localhost:${port}`)
  )
}
