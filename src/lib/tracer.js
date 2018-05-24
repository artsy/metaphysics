import config from "config"
import { forIn, has } from "lodash"
import { getNamedType, GraphQLObjectType } from "graphql"
import * as introspectionQuery from "graphql/type/introspection"

const { DD_TRACER_SERVICE_NAME, DD_TRACER_HOSTNAME } = config

const tracer = require("dd-trace").init(
  {
    service: DD_TRACER_SERVICE_NAME,
    hostname: DD_TRACER_HOSTNAME,
  }
)
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

function trace(res, span) {
  span.setTag("http.status_code", res.statusCode)
  span.finish()
}

function wrapResolve(typeName, fieldName, resolver) {
  return function wrappedResolver() {
    return tracer.trace("graphql.resolver", {
      resource: typeName + ": " + fieldName,
    }).then(span => {
      const result = resolver.apply(this, arguments)

      if (result instanceof Promise) {
        return result.finally(() => span.finish())
      }

      span.finish()
      return result
    })
  }
}

export function makeSchemaTraceable(schema) {
  // Walk the schema and for all object type fields with resolvers wrap them in our tracing resolver.
  forIn(schema._typeMap, (type, typeName) => {
    if (!introspectionQuery[type] && has(type, "_fields")) {
      forIn(type._fields, (field, fieldName) => {
        if (
          field.resolve instanceof Function &&
          getNamedType(field.type) instanceof GraphQLObjectType
        ) {
          field.resolve = wrapResolve(typeName, fieldName, field.resolve) // eslint-disable-line no-param-reassign
        }
      })
    }
  })
}

export function middleware(req, res, next) {
  let resource = req.path
  let query = ""
  if (req.body && req.body.query) {
    resource = drop_params(req.body.query)
    query = req.body.query
  }

  tracer.trace("graphql.query", { resource }).then(span => {
    span.setTag('query', query)
    
    res.locals.span = span // eslint-disable-line no-param-reassign

    const finish = trace.bind(null, res, span)
    res.on("finish", finish)
    res.on("close", finish)

    next()
  })
}
