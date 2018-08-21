import uuid from "uuid/v1"

export function headers({ requestID, traceId, parentSpanId, xForwardedFor }) {
  return {
    "X-Request-Id": requestID,
    "x-datadog-trace-id": traceId,
    "x-datadog-parent-id": parentSpanId,
    "X-Forwarded-For": xForwardedFor,
  }
}

function resolveProxies(req) {
  if (req.headers["x-forwarded-for"]) {
    return req.headers["x-forwarded-for"] + ", " + req.connection.remoteAddress
  } else {
    return req.connection.remoteAddress
  }
}

export function middleware(req, res, next) {
  // General request ID
  const requestID = req.headers["x-request-id"] || uuid()

  // X-Forwarded-For client IP
  const xForwardedFor = resolveProxies(req)

  // Setup tracer related IDs
  const span = res.locals.span
  const traceContext = span && span.context()
  const traceId = span ? traceContext.traceId : ""
  const parentSpanId = span ? traceContext.spanId : ""

  res.locals.requestIDs = { requestID, traceId, parentSpanId, xForwardedFor } // eslint-disable-line no-param-reassign
  next()
}
