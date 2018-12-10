export class HTTPError extends Error {
  public statusCode: number
  public body?: string

  constructor(message: string, statusCode: number, body?: string) {
    super(message)
    this.statusCode = statusCode
    this.body = body
    Error.captureStackTrace(this, this.constructor)
  }
}
