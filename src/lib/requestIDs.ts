import uuid from "uuid/v1"

export function headers({ requestID, xForwardedFor }) {
  const headers = {
    "x-request-id": requestID,
    "x-forwarded-for": xForwardedFor,
  }
  return headers
}

function resolveProxies(req) {
  if (req.headers["x-forwarded-for"]) {
    return `${req.headers["x-forwarded-for"]}, ${req.connection.remoteAddress}`
  } else {
    return req.connection.remoteAddress
  }
}

export function middleware(req, res, next) {
  // General request ID
  const requestID = req.headers["x-request-id"] || uuid()

  // X-Forwarded-For client IP
  const xForwardedFor = resolveProxies(req)

  res.locals.requestIDs = { requestID, xForwardedFor } // eslint-disable-line no-param-reassign
  next()
}
