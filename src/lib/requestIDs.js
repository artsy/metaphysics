import uuid from "uuid/v1"

export function headers({ requestID, traceId, parentSpanId }) {
  return {
    "X-Request-Id": requestID,
    "x-datadog-trace-id": traceId,
    "x-datadog-parent-id": parentSpanId,
  }
}

export function middleware(req, res, next) {
  // General request ID
  const requestID = req.headers["x-request-id"] || uuid()

  // Setup tracer related IDs
  const { span } = res.locals
  const traceContext = span && span.context()
  const traceId = span ? traceContext.traceId : ""
  const parentSpanId = span ? traceContext.spanId : ""

  res.locals.requestIDs = { requestID, traceId, parentSpanId } // eslint-disable-line no-param-reassign
  next()
}
