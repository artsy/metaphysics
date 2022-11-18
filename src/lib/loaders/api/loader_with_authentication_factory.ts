import DataLoader from "dataloader"
import extensionsLogger, { formatBytes } from "lib/loaders/api/extensionsLogger"
import { verbose, warn } from "lib/loggers"
import timer from "lib/timer"
import { pick } from "lodash"
import { LoaderFactory } from "../index"
import { DataLoaderKey } from "./index"
import { loaderInterface } from "./loader_interface"

/**
 * This returns a function that takes an access token to create a data loader factory for the given `api`.
 *
 * The access token should be provided by a function which returns a `Promise` that produces the token. This function is
 * called lazily, so no requests will be made to e.g. Gravity to fetch a token until really needed.
 *
 * The data loaders produced by this factory do cache data for the duration of the query execution, but do not cache
 * data to memcache.
 *
 * @param api a function that performs an API request
 * @param apiName a function that performs an API request
 * @param globalAPIOptions options that need to be passed to any API loader created with this factory
 */
export const apiLoaderWithAuthenticationFactory = <T = any>(
  api: (path: string, token: string, apiOptions: any) => Promise<any>,
  apiName: string,
  globalAPIOptions: any
) => {
  return (accessTokenLoader) => {
    const apiLoaderFactory = (path, globalParams = {}, pathAPIOptions = {}) => {
      const loader = new DataLoader<
        DataLoaderKey,
        T | { body: T; headers: any }
      >(
        (keys) => {
          return accessTokenLoader().then((accessToken) =>
            Promise.all(
              keys.map(({ key, apiOptions: invocationAPIOptions }) => {
                const apiOptions = {
                  ...globalAPIOptions,
                  ...pathAPIOptions,
                  ...invocationAPIOptions,
                }

                const clock = timer(key)
                clock.start()

                return new Promise((resolve, reject) => {
                  verbose(`Requested: ${key}`)
                  api(key, accessToken, apiOptions)
                    .then((response) => {
                      if (apiOptions.headers) {
                        resolve(pick(response, ["body", "headers"]))
                      } else {
                        resolve(response.body)
                      }
                      const time = clock.end()
                      const length = formatBytes(
                        (response && response.headers["content-length"]) || 0
                      )
                      return extensionsLogger(
                        globalAPIOptions.requestIDs.requestID,
                        apiName,
                        key,
                        { time, cache: false, length }
                      )
                    })
                    .catch((error) => {
                      warn(path, error)
                      reject(error)

                      // Log failed requests
                      extensionsLogger(
                        globalAPIOptions.requestIDs.requestID,
                        apiName,
                        key,
                        { failed: true, error }
                      )
                    })
                })
              })
            )
          )
        },
        {
          batch: false,
          cache: true,
          cacheKeyFn: (input) => JSON.stringify(input),
        }
      )
      return loaderInterface(loader, path, globalParams)
    }
    return apiLoaderFactory as LoaderFactory
  }
}
