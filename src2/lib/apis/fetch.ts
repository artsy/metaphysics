import { assign, clone, get, defaults, compact } from "lodash"
import request from "request"
import config from "config"
import { HTTPError } from "lib/HTTPError"
import { parse, stringify } from "qs"
import { isExisty } from "lib/helpers"

interface RequestBodyParams {
  body?: Record<string, unknown>
  json?: boolean
}

interface URLAndRequestBodyParams extends RequestBodyParams {
  url: string
}

export const constructUrlAndParams = (
  method: string,
  url: string
): URLAndRequestBodyParams => {
  const opts: RequestBodyParams = {}

  if (method === "PUT" || method === "POST" || method === "DELETE") {
    const [path, queryParams] = url.split("?")
    const parsedParams = parse(queryParams, { arrayLimit: 1000 })

    let body

    if (isExisty(parsedParams)) {
      // If the query params are formatted in a 0, 1, 2 way we know it's an array
      // disguised as an object. Convert it back to an array.
      // TODO: Extract this into own PR and write a test
      const isArray = Object.keys(parsedParams)
        .map(Number)
        .every((key) => !Number.isNaN(key) && typeof key === "number")

      if (isArray) {
        const arrayParams = Object.entries(parsedParams).map(
          ([_, entry]) => entry
        )
        body = arrayParams
      } else {
        // We need to allow `key: null` to be sent in a way that unsets (`null`), and not as an empty string
        body = Object.keys(parsedParams).reduce((acc, key) => {
          acc[key] = parsedParams[key] === "" ? null : parsedParams[key]
          return acc
        }, {})
      }

      opts.body = body
      opts.json = true

      return { url: path, ...opts }
    }
  }

  const [path, queryParams] = url.split("?")
  const parsedParams = parse(queryParams, { arrayLimit: 1000 })

  // For GETs, we need to be sure we're making requests using brackets notation
  // since backends dont understand indicies (for GET)
  const reformattedQueryParams = stringify(parsedParams, {
    arrayFormat: "brackets",
  })

  return {
    url: reformattedQueryParams ? `${path}?${reformattedQueryParams}` : path,
  }
}

// TODO: This `any` is a shame, but
// the type seems to be a bit of a mix of the original
// response and some faffing
export default (url: string, options = {}) => {
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
        // If `request.body` is a string, we can include it in the message.
        const body =
          typeof response.body === "string"
            ? response.body
            : response.statusMessage

        const message = compact([get(response, "request.uri.href"), body]).join(
          " - "
        )
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
