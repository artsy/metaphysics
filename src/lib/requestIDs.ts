import uuid from "uuid/v1"
import ip from "ip"

export function headers({ requestID, xForwardedFor, xOriginalSessionID }) {
  const headers = {
    "x-request-id": requestID,
    "x-forwarded-for": xForwardedFor,
    "x-original-session-id": xOriginalSessionID,
  }
  return headers
}

export function resolveIPv4(ipAddress) {
  if (ip.isV6Format(ipAddress) && ~ipAddress.indexOf("::ffff")) {
    return ipAddress.split("::ffff:")[1]
  }
  return ipAddress
}

function resolveProxies(req) {
  const ipAddress = resolveIPv4(req.connection.remoteAddress)

  if (req.headers["x-forwarded-for"]) {
    return `${req.headers["x-forwarded-for"]}, ${ipAddress}`
  } else {
    return ipAddress
  }
}

export function middleware(req, res, next) {
  // General request ID
  const requestID = req.headers["x-request-id"] || uuid()

  const xOriginalSessionID = req.headers["x-original-session-id"] || null

  // X-Forwarded-For client IP
  const xForwardedFor = resolveProxies(req)

  res.locals.requestIDs = { requestID, xForwardedFor, xOriginalSessionID } // eslint-disable-line no-param-reassign
  next()
}
