import config from "config"

const { DD_TRACER_SERVICE_NAME, DD_TRACER_HOSTNAME } = config

const tracer = require("dd-trace").init({
  service: DD_TRACER_SERVICE_NAME,
  hostname: DD_TRACER_HOSTNAME,
})
tracer.use("express", {
  service: DD_TRACER_SERVICE_NAME + ".request",
})
tracer.use("http", {
  service: DD_TRACER_SERVICE_NAME + ".http-client",
})
tracer.use("redis", {
  service: DD_TRACER_SERVICE_NAME + ".redis",
})

function parse_args() {
  return "( ... )"
}

function drop_params(query) {
  return query.replace(/(\()([^\)]*)(\))/g, parse_args)
}

export async function traceMiddleware(resolve, parent, args, ctx, info) {
  const span = await tracer.trace("graphql.resolver", {
    resource: info.parentType + ": " + info.fieldName,
  })
  const result = await resolve(parent, args, ctx, info)
  span.finish()
  return result
}

function trace(res, span) {
  span.setTag("http.status_code", res.statusCode)
  span.finish()
}

export function middleware(req, res, next) {
  let resource = req.path
  let query = ""
  if (req.body && req.body.query) {
    resource = drop_params(req.body.query)
    query = req.body.query
  }

  tracer.trace("graphql.query", { resource }).then(span => {
    span.setTag("query", query)

    res.locals.span = span // eslint-disable-line no-param-reassign

    const finish = trace.bind(null, res, span)
    res.on("finish", finish)
    res.on("close", finish)

    next()
  })
}
