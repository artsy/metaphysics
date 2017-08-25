import timer from "lib/timer"
import { verbose, error } from "lib/loggers"
import { pick } from "lodash"

export default (api, accessToken, loaderOptions = {}) => {
  return path => {
    const clock = timer(path)
    clock.start()
    return new Promise((resolve, reject) => {
      verbose(`Requested: ${path}`)
      api(path, accessToken, loaderOptions)
        .then(response => {
          if (loaderOptions.headers) {
            resolve(pick(response, ["body", "headers"]))
          } else {
            resolve(response.body)
          }
          clock.end()
        })
        .catch(err => {
          error(path, err)
          reject(err)
        })
    })
  }
}
