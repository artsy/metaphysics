// @ts-check
import "moment-timezone"
import "artsy-newrelic"
import Bluebird from "bluebird"
import xapp from "artsy-xapp"
import express from "express"
import forceSSL from "express-force-ssl"
import bodyParser from "body-parser"
import config from "./src/config"
import { info, error } from "./src/lib/loggers"
import { mergeSchemas } from "./src/lib/mergeSchemas"

global.Promise = Bluebird

const { PORT, NODE_ENV, GRAVITY_API_URL, GRAVITY_ID, GRAVITY_SECRET, ENABLE_SCHEMA_STITCHING } = process.env

const app = express()
const port = PORT || 3000
const isDevelopment = NODE_ENV === "development"
const isProduction = NODE_ENV === "production"
const enableSchemaStitching = ENABLE_SCHEMA_STITCHING === "true"

function startApp() {
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

  // add mount point here
  if (isDevelopment) {
    app.use(require("./src"))
  } else {
    app.use(require("./src"))
  }

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
    if (enableSchemaStitching) {
      console.warn("[FEATURE] Enabling schema stitching") // eslint-disable-line
      mergeSchemas().then(startApp)
    } else {
      startApp()
    }
  }
)
