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
import Tracer from "datadog-tracer"
import { PartnersAggregation } from "schema/aggregations/filter_partners_aggregation"

import { forIn, has } from "lodash"
//import { initGlobalTracer } from "opentracing"

global.Promise = Bluebird

const { PORT, NODE_ENV, GRAVITY_API_URL, GRAVITY_ID, GRAVITY_SECRET, QUERY_DEPTH_LIMIT } = process.env

const app = express()
const port = PORT || 3000
const queryLimit = parseInt(QUERY_DEPTH_LIMIT, 10) || 10 // Default to ten.

const tracer = new Tracer({ service: "metaphysics" })

if (NODE_ENV === "production") {
  app.set("forceSSLOptions", { trustXFPHeader: true }).use(forceSSL)
  app.set("trust proxy", 1)
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
  () => (config.GRAVITY_XAPP_TOKEN = xapp.token)
)

app.get("/favicon.ico", (_req, res) => {
  res
    .status(200)
    .set({ "Content-Type": "image/x-icon" })
    .end()
})

app.all("/graphql", (req, res) => res.redirect("/"))

app.use(bodyParser.json())

function parse_args(match, lp, args, rp) {
  // @TODO: Parse args like `(foo: wow, cool: man)` to (foo:, cool:) because that's
  // useful info for the key, we just can't use actual query values.`
  //console.log(args)
  return "( ... )"
}

function trace(req, res, span) {
  console.log("SPAN END")
  //console.log(span)
  span.finish()
}

app.use((req, res, next) => {
  if (req.method === "POST") {
    console.log("SPAN BEGIN")
    var span = tracer.startSpan("metaphysics.query")
    var query = req.body.query.replace(/(\()([^\)]*)(\))/g, parse_args)
    span.addTags({
      "resource": "[TEST11]" + query,
      "type": "web",
      "span.kind": "server",
      "http.method": req.method,
      "http.url": req.url,
      "http.status_code": res.statusCode
    })
    req.span = span

    res.on("finish", () => trace(req, res, span))
    res.on("close", () => trace(req, res, span))
  }
  next()
})

function wrapResolve(typeName, fieldName, resolver) {
  return function (root, options, request) {
    //console.log('me: ' + typeName + " resolver for " + fieldName)
    if (has(request, 'thereWasAParent')) {
      //console.log('parent: ' + request.thereWasAParent)
    }

    var parentSpan = request.span
    var span = parentSpan.tracer().startSpan('metaphysics.resolver.' + typeName + '.' + fieldName, { childOf: parentSpan.context() })
    span.addTags({
      'resource': typeName + ": " + fieldName,
      'type': 'web',
      'span.kind': 'server'
    })

    request.span = span
    request.thereWasAParent = typeName + " resolver for " + fieldName
    var result = resolver.apply(this, arguments);
    request.span = parentSpan

    //console.log(result)
    if (result instanceof Promise) {
      //console.log("THIS IS A PROMISE I THINK")
      //console.log(result)
      return result.finally(function () {
        span.finish()
      })
    }

    span.finish()
    return result;
  };
}

// @TODO(steve): Don't do this here and figure out the best way to actually do it.
// @TODO(steve): how 2 node cuz I dunno
// I guess there is lodash or something in here I could use.
forIn(schema._typeMap, function (value, key) {
  const typeName = key
  if (has(value, '_fields')) {
    forIn(value._fields, function (value, key) {
      const fieldName = key
      if (has(value, 'resolve') && value.resolve instanceof Function) {
        //console.log(value.resolve)
        value.resolve = wrapResolve(typeName, fieldName, value.resolve)
      }
    });
  }
  // if it has _fields instrument all those field resolvers

});

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
    const requestID = request.headers["x-request-id"] || "implement-me"

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
    }
  })
)

app.listen(port, () => info(`Listening on ${port}`))
