export default class HTTPError extends Error {
  statusCode
  body

  constructor(message, statusCode, body?: object) {
    super(message)
    this.statusCode = statusCode
    this.body = body
    Error.captureStackTrace(this, this.constructor)
  }
}
