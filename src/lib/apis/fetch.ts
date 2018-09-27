import { assign, clone, get, defaults, compact } from "lodash"
import request from "request"
import config from "config"
import HTTPError from "lib/http_error"

// TODO: This `any` is a shame, but
// the type seems to be a bit of a mix of the original
// response and some faffing

export default (url, options = {}) => {
  return new Promise<any>((resolve, reject) => {
    const opts: any = clone(
      defaults(options, {
        method: "GET",
        timeout: config.REQUEST_TIMEOUT_MS,
      })
    )

    // Wrap user agent
    const userAgent = opts.userAgent
      ? opts.userAgent + "; Metaphysics"
      : "Metaphysics"
    delete opts.userAgent
    opts.headers = assign({}, { "User-Agent": userAgent }, opts.headers)

    request(url, opts, (err, response) => {
      // If there is an error or non-200 status code, reject.
      if (
        !!err ||
        (response.statusCode && !response.statusCode.toString().match(/^2/))
      ) {
        if (err) return reject(err)

        const message = compact([
          get(response, "request.uri.href"),
          response.body,
        ]).join(" - ")
        return reject(
          new HTTPError(message, response.statusCode, response.body)
        )
      }

      try {
        const shouldParse = typeof response.body === "string"
        const parsed = shouldParse ? JSON.parse(response.body) : response.body

        resolve({
          body: parsed,
          headers: response.headers,
        })
      } catch (error) {
        reject(error)
      }
    })
  })
}
