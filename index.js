import "moment-timezone"
import "artsy-newrelic"
import Bluebird from "bluebird"
import xapp from "artsy-xapp"
import express from "express"
import forceSSL from "express-force-ssl"
import bodyParser from "body-parser"
import config from "./src/config"
import { createReloadable } from "@artsy/express-reloadable"
import { info, error } from "./src/lib/loggers"

const { GRAVITY_API_URL, GRAVITY_ID, GRAVITY_SECRET, NODE_ENV, PORT } = process.env

global.Promise = Bluebird

const app = express()
const port = PORT || 3000
const isDevelopment = NODE_ENV === "development"
const isProduction = NODE_ENV === "production"

xapp.on("error", err => {
  error(err)
  process.exit(1)
})

const xappConfig = {
  url: GRAVITY_API_URL,
  id: GRAVITY_ID,
  secret: GRAVITY_SECRET,
}

xapp.init(xappConfig, () => {
  config.GRAVITY_XAPP_TOKEN = xapp.token
  bootApp() // eslint-disable-line
})

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
    const mountAndReload = createReloadable(app, require)
    mountAndReload("./src")
  } else {
    app.use(require("./src").default)
  }

  app.listen(port, () => info(`Listening on ${port}`))
}
