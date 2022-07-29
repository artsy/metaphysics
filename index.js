import "moment-timezone"
import xapp from "@artsy/xapp"
import compression from "compression"
import bodyParser from "body-parser"
import { info, error } from "./src/lib/loggers"
import config from "./src/config"
import cache from "./src/lib/cache"
import { init as initTracer } from "./src/lib/tracer"
import { IpFilter as ipfilter } from "express-ipfilter"
import { errorHandler } from "./src/lib/errorHandler"

const {
  ENABLE_ASYNC_STACK_TRACES,
  ENABLE_QUERY_TRACING,
  GRAVITY_API_URL,
  GRAVITY_ID,
  GRAVITY_SECRET,
  IP_DENYLIST,
  NODE_ENV,
  PORT,
} = config

const port = PORT
const isDevelopment = NODE_ENV === "development"
const enableAsyncStackTraces = ENABLE_ASYNC_STACK_TRACES === "true"
const enableQueryTracing = ENABLE_QUERY_TRACING === "true"

let server, isShuttingDown, hasBooted

// This needs to happen as early as possible so the plugins can hook into the
// modules we use before any other code gets a chance to use them. Additionally,
// since dd-trace monkey patches express it needs to be loaded before creating
// the graphql server otherwise we will not have accurate tracing on those
// routes.
if (enableQueryTracing) {
  if (isDevelopment) {
    console.warn(
      "[WARNING] You probably don't want ENABLE_QUERY_TRACING set to true in .env"
    )
  }
  console.warn("[FEATURE] Enabling query tracing")
  initTracer()
}

if (enableAsyncStackTraces) {
  console.warn("[FEATURE] Enabling long async stack traces") // eslint-disable-line
  require("longjohn")
}

// Use require here so that it definitely gets loaded /after/ initializing the
// datadog client, which is needed so it can hook into supported modules such as
// express.
const app = require("express")()

app.use(compression())

xapp.on("error", (err) => {
  error(
    "Could not start Metaphysics because it could not set up the xapp token, this is likely due to your `GRAVITY_*` env vars:"
  )
  error(err)
  process.exit(1)
})

const xappConfig = {
  url: GRAVITY_API_URL,
  id: GRAVITY_ID,
  secret: GRAVITY_SECRET,
}

xapp.init(xappConfig, (_unused, token) => {
  config.GRAVITY_XAPP_TOKEN = token
  if (hasBooted) return
  bootApp()
  hasBooted = true
}) // eslint-disable-line

function bootApp() {
  if (IP_DENYLIST) {
    app.use(
      ipfilter(IP_DENYLIST.split(","), {
        allowedHeaders: ["x-forwarded-for"],
        log: false,
        mode: "deny",
      })
    )
  }

  app.use(bodyParser.json())

  app.get("/favicon.ico", (_req, res) => {
    res.status(200).set({ "Content-Type": "image/x-icon" }).end()
  })

  app.get("/health", (req, res) => {
    if (isShuttingDown) {
      return res.status(503).end()
    }
    cache
      .isAvailable()
      .then((_stats) => {
        return res.status(200).end()
      })
      .catch((_err) => {
        return res.status(503).end()
      })
  })

  app.all("/graphql", (_req, res) => res.redirect("/v2"))

  if (isDevelopment) {
    const { createReloadable } = require("@artsy/express-reloadable")
    const mountAndReload = createReloadable(app, require)
    mountAndReload("./src")
  } else {
    app.use(require("./src").default)
  }

  server = require("http-shutdown")(
    app.listen(port, () =>
      info(`[Metaphysics] Listening on http://localhost:${port}/v2`)
    )
  )

  // General error handler, should be last (and after Sentry's).
  app.use(errorHandler)
}

process.on("SIGTERM", gracefulExit)

function gracefulExit() {
  if (isShuttingDown) return
  isShuttingDown = true
  console.log("Received signal SIGTERM, shutting down")
  server.shutdown(function () {
    console.log("Closed existing connections.")
    process.exit(0)
  })
}
