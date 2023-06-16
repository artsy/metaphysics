import uuid from "uuid/v1"
import ip from "ip"
import { error } from "./loggers"

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

export const requestIPAddress = (req) => {
  let ipAddress = resolveIPv4(req.connection.remoteAddress)
  if (req.headers["x-forwarded-for"]) {
    try {
      const firstAddress = req.headers["x-forwarded-for"].split(",")[0]
      ipAddress = resolveIPv4(firstAddress)
    } catch (e) {
      error(`Invalid X-Forwarded-For header: ${e}`)
    }
  }

  return ipAddress
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
