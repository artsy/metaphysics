import "moment-timezone"
import Bluebird from "bluebird"
import xapp from "artsy-xapp"
import compression from "compression"
import express from "express"
import forceSSL from "express-force-ssl"
import bodyParser from "body-parser"
import { info, error } from "./src/lib/loggers"
import config from "config"
import cache from "lib/cache"

const {
  ENABLE_ASYNC_STACK_TRACES,
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

let server, isShuttingDown

if (enableAsyncStackTraces) {
  console.warn("[FEATURE] Enabling long async stack traces") // eslint-disable-line
  require("longjohn")
}

const app = express()

app.use(compression())

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

  app.get("/health", (req, res) => {
    if (isShuttingDown) {
      return res.status(503).end()
    }
    cache
      .isAvailable()
      .then(stats => {
        return res.status(200).end()
      })
      .catch(err => {
        return res.status(503).end()
      })
  })

  app.all("/graphql", (_req, res) => res.redirect("/"))

  if (isDevelopment) {
    const { createReloadable } = require("@artsy/express-reloadable")
    const mountAndReload = createReloadable(app, require)
    mountAndReload("./src")
  } else {
    app.use(require("./src").default)
  }

  server = require("http-shutdown")(
    app.listen(port, () =>
      info(`[Metaphysics] Listening on http://localhost:${port}`)
    )
  )
}

process.on("SIGTERM", gracefulExit)

function gracefulExit() {
  if (isShuttingDown) return
  isShuttingDown = true
  console.log("Received signal SIGTERM, shutting down")
  server.shutdown(function() {
    console.log("Closed existing connections.")
    process.exit(0)
  })
}
