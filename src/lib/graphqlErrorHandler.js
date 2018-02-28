import config from "config"
const isProduction = config.NODE_ENV === "production"

export default function graphqlErrorHandler() {
  // export default function graphqlErrorHandler(query) {
  // if (config.NEW_RELIC_LICENSE_KEY) {
  //   const newrelic = require("newrelic")
  //   return graphqlError => {
  //     const error = graphqlError.originalError || graphqlError
  //     if (error.statusCode === undefined || error.statusCode >= 500) {
  //       newrelic.noticeError(error, query)
  //     }
  //     return { message: error.message }
  //   }
  // }
  return error => ({
    message: error.message,
    locations: error.locations,
    stack: isProduction ? null : error.stack,
  })
}
