export default class HTTPError extends Error {
  constructor(message, statusCode, body) {
    super(message)
    this.statusCode = statusCode
    this.body = body
    Error.captureStackTrace(this, this.constructor)
  }
}
