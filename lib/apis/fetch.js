// @ts-check

import { get, defaults, compact } from "lodash"
import request from "request"
import config from "config"
import HTTPError from "lib/http_error"

export default (url, options = {}) => {
  return new Promise((resolve, reject) => {
    const opts = defaults(options, {
      method: "GET",
      timeout: config.REQUEST_TIMEOUT_MS,
    })

    request(url, opts, (err, response) => {
      // If there is an error or non-200 status code, reject.
      if (!!err || (response.statusCode && !response.statusCode.toString().match(/^2/))) {
        if (err) return reject(err)

        const message = compact([get(response, "request.uri.href"), response.body]).join(" - ")
        return reject(new HTTPError(message, response.statusCode))
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
