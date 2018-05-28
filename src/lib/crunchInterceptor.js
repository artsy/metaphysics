import { crunch } from "graphql-crunch"
import interceptor from "express-interceptor"

export const interceptorCallback = req => ({
  isInterceptable: () =>
    req.query.hasOwnProperty("crunch") || req.headers["x-crunch"],
  intercept: (body, send) => {
    body = JSON.parse(body) // eslint-disable-line no-param-reassign
    if (body) {
      body = crunch(body) // eslint-disable-line no-param-reassign
    }
    send(JSON.stringify(body))
  },
})

export default interceptor(interceptorCallback)
