import { crunch } from "graphql-crunch"
import interceptor from "express-interceptor"

export const interceptorCallback = req => {return {
  isInterceptable: () => {return req.query.hasOwnProperty("crunch")},
  intercept: (body, send) => {
    body = JSON.parse(body) // eslint-disable-line no-param-reassign
    if (body && body.data) {
      body.data = crunch(body.data) // eslint-disable-line no-param-reassign
    }
    send(JSON.stringify(body))
  },
}}

export default interceptor(interceptorCallback)
