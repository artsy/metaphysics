import { crunch } from "graphql-crunch"
import interceptor from "express-interceptor"

export default interceptor(req => ({
  isInterceptable: () => req.query.hasOwnProperty("crunch"),
  intercept: (body, send) => {
    body = JSON.parse(body) // eslint-disable-line no-param-reassign
    if (body && body.data) {
      body.data = crunch(body.data) // eslint-disable-line no-param-reassign
    }
    send(JSON.stringify(body))
  },
}))
