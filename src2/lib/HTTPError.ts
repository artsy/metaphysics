type Body = { [key: string]: any }

export class HTTPError extends Error {
  public statusCode: number
  public body?: Body | string

  constructor(message: string, statusCode: number, body?: Body | string) {
    super(message)
    this.statusCode = statusCode
    this.body = body
    Error.captureStackTrace(this, this.constructor)
  }
}
