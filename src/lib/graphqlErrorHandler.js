import config from "config"
const isProduction = config.NODE_ENV === "production"

export default function graphqlErrorHandler() {
  return error => ({
    message: error.message,
    locations: error.locations,
    stack: isProduction ? null : error.stack,
  })
}
