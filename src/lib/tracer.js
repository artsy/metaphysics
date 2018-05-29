import Tracer from "datadog-tracer"
import config from "config"
import { forIn, has } from "lodash"
import { getNamedType, GraphQLObjectType } from "graphql"
import * as introspectionQuery from "graphql/type/introspection"

const { DD_TRACER_SERVICE_NAME, DD_TRACER_HOSTNAME } = config

const tracer = new Tracer({
  service: DD_TRACER_SERVICE_NAME,
  hostname: DD_TRACER_HOSTNAME,
})

function parse_args() {
  return "( ... )"
}

function drop_params(query) {
  return query.replace(/(\()([^)]*)(\))/g, parse_args)
}

function trace(res, span) {
  span.addTags({
    "http.status_code": res.statusCode,
  })
  span.finish()
}

function wrapResolve(typeName, fieldName, resolver) {
  return function wrappedResolver(_root, _opts, _req, { rootValue }) {
    const parentSpan = rootValue.span
    const span = parentSpan
      .tracer()
      .startSpan(
        `${DD_TRACER_SERVICE_NAME}.resolver.${typeName}.${fieldName}`,
        {
          childOf: parentSpan.context(),
        },
    )
    span.addTags({
      resource: `${typeName}: ${fieldName}`,
      type: "web",
      "span.kind": "server",
    })

    // Set the parent context to this span for any sub resolvers.
    rootValue.span = span // eslint-disable-line no-param-reassign

    const result = resolver.apply(this, arguments) // eslint-disable-line prefer-rest-params

    // Return parent context to our parent for any resolvers called after this one.
    rootValue.span = parentSpan // eslint-disable-line no-param-reassign

    if (result instanceof Promise) {
      return result.finally(() => span.finish())
    }

    span.finish()
    return result
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
  const span = tracer.startSpan(`${DD_TRACER_SERVICE_NAME}.query`)
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

  res.locals.span = span // eslint-disable-line no-param-reassign

  const finish = trace.bind(null, res, span)
  res.on("finish", finish)
  res.on("close", finish)

  next()
}
