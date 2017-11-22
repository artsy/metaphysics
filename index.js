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
import mergeSchemas from "./lib/mergeSchemas"
import legacyLoaders from "./lib/loaders/legacy"
import createLoaders from "./lib/loaders"
import config from "./config"
import { info, error } from "./lib/loggers"
import graphqlErrorHandler from "./lib/graphql-error-handler"
import moment from "moment"
import "moment-timezone"
import Tracer from "datadog-tracer"
import { forIn, has, assign } from "lodash"
import uuid from "uuid/v1"
import { fetchLoggerSetup, fetchLoggerRequestDone } from "lib/loaders/api/logger"
import { timestamp } from "./lib/helpers"
import { getNamedType, GraphQLObjectType } from "graphql"
import * as introspectionQuery from "graphql/type/introspection"

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

  function parse_args() {
    return "( ... )"
  }

  function drop_params(query) {
    return query.replace(/(\()([^\)]*)(\))/g, parse_args)
  }

  function pushFinishedSpan(finishedSpans, span) {
    const endTime = timestamp()
    finishedSpans.push({ span, endTime })
  }

  function processFinishedSpans(finishedSpans) {
    let i = 0
    const iter = () => {
      const entry = finishedSpans[i]
      if (entry) {
        const { span, endTime } = entry
        span.finish(endTime)
        i++
        setImmediate(iter)
      }
    }
    setImmediate(iter)
  }

  function trace(res, span, finishedSpans) {
    span.addTags({
      "http.status_code": res.statusCode,
    })
    pushFinishedSpan(finishedSpans, span)
    processFinishedSpans(finishedSpans)
  }

  if (!isProduction) {
    app.use((req, res, next) => {
      const tracer = new Tracer({ service: "metaphysics" })
      const span = tracer.startSpan("metaphysics.query")
      span.addTags({
        type: "web",
        "span.kind": "server",
        "http.method": req.method,
        "http.url": req.url,
      })

      if (req.body && req.body.query) {
        const query = drop_params(req.body.query)
        span.addTags({ resource: query })
      } else {
        span.addTags({ resource: req.path })
      }

      assign(req, { span })

      const finishedSpans = []
      assign(req, { finishedSpans })

      const finish = trace.bind(null, res, span, finishedSpans)
      res.on("finish", finish)
      res.on("close", finish)

      next()
    })
  }

  function wrapResolve(typeName, fieldName, resolver) {
    return function wrappedResolver(_root, _opts, _req, { rootValue }) {
      const parentSpan = rootValue.span
      const span = parentSpan
        .tracer()
        .startSpan("metaphysics.resolver." + typeName + "." + fieldName, { childOf: parentSpan.context() })
      span.addTags({
        resource: typeName + ": " + fieldName,
        type: "web",
        "span.kind": "server",
      })

      // Set the parent context to this span for any sub resolvers.
      rootValue.span = span // eslint-disable-line no-param-reassign

      const result = resolver.apply(this, arguments)

      // Return parent context to our parent for any resolvers called after this one.
      rootValue.span = parentSpan // eslint-disable-line no-param-reassign

      if (result instanceof Promise) {
        return result.finally(() => pushFinishedSpan(rootValue.finishedSpans, span))
      }

      pushFinishedSpan(rootValue.finishedSpans, span)
      return result
    }
  }

  if (!isProduction) {
    // Walk the schema and for all object type fields with resolvers wrap them in our tracing resolver.
    forIn(schema._typeMap, (type, typeName) => {
      if (!introspectionQuery[type] && has(type, "_fields")) {
        forIn(type._fields, (field, fieldName) => {
          if (field.resolve instanceof Function && getNamedType(field.type) instanceof GraphQLObjectType) {
            field.resolve = wrapResolve(typeName, fieldName, field.resolve) // eslint-disable-line no-param-reassign
          }
        })
      }
    })
  }

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
      const requestID = req.headers["x-request-id"] || uuid()

      const requestIDs = { requestID, parentSpanId: "", traceId: "" }
      let span = null

      if (!isProduction) {
        span = req.span
        const traceContext = span.context()
        const traceId = traceContext.traceId
        const parentSpanId = traceContext.spanId

        assign(requestIDs, { traceId, parentSpanId })
      }

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
          finishedSpans: req.finishedSpans,
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
