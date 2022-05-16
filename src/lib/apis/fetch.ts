import { assign, clone, get, defaults, compact } from "lodash"
import request from "request"
import config from "config"
import { HTTPError } from "lib/HTTPError"
import { parse } from "qs"
import { isExisty } from "lib/helpers"

interface RequestBodyParams {
  body?: Record<string, unknown>
  json?: boolean
}

interface URLAndRequestBodyParams extends RequestBodyParams {
  url: string
}

export const constructUrlAndParams = (method, url): URLAndRequestBodyParams => {
  const opts: RequestBodyParams = {}

  if (method === "PUT" || method === "POST" || method === "DELETE") {
    const [path, queryParams] = url.split("?")
    const parsedParams = parse(queryParams)

    if (isExisty(parsedParams)) {
      opts.body = parsedParams
      opts.json = true

      return { url: path, ...opts }
    }
  }

  return { url }
}

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

    const { method } = opts
    const { url: cleanedUrl, body, json } = constructUrlAndParams(method, url)

    request(cleanedUrl, { ...opts, body, json }, (err, response) => {
      if (err) return reject(err)
      // If there is a non-200 status code, reject.
      if (
        response.statusCode &&
        (response.statusCode < 200 || response.statusCode >= 300)
      ) {
        const message = compact([
          get(response, "request.uri.href"),
          response.body,
        ]).join(" - ")
        return reject(
          new HTTPError(message, response.statusCode || 500, response.body)
        )
      }

      try {
        const shouldParse =
          typeof response.body === "string" && response.body !== ""
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
