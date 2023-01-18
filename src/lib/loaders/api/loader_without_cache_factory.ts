import DataLoader from "dataloader"
import { loaderInterface } from "./loader_interface"
import { LoaderFactory } from "../index"
import { API, DataLoaderKey, APIOptions } from "./index"
import { warn } from "lib/loggers"
import gravity from "lib/apis/gravity"
import extensionsLogger, { formatBytes } from "lib/loaders/api/extensionsLogger"
import timer from "lib/timer"

/**
 * This factory provides a short-cut system for our data loader system, it provides
 * an uncached result that is close to the equivalent to calling the fetch request directly.
 *
 * @param {(string, any) => Promise<any>} api a function that performs an API request
 * @param {string} apiName the name of the API service
 */

export const unauthenticatedUncachedApiLoaderFactory = <T = any>(
  api: API,
  apiName: string,
  apiOptions: APIOptions = {}
) => {
  const apiLoaderFactory = (
    path: string,
    globalParams = {},
    pathAPIOptions = {}
  ) => {
    const loader = new DataLoader<DataLoaderKey, T | { body: T; headers: any }>(
      (keys) =>
        Promise.all<any>(
          keys.map(({ key, apiOptions: invocationAPIOptions }) => {
            const options = {
              ...apiOptions,
              ...pathAPIOptions,
              ...invocationAPIOptions,
            }

            const clock = timer(key)
            clock.start()

            const result = new Promise((resolve, reject) => {
              api(key, null, options)
                .then(({ body, headers }) => {
                  if (options?.headers) {
                    resolve({ body, headers })
                  } else {
                    resolve(body)
                  }
                  const time = clock.end()
                  const length = formatBytes(headers["content-length"] || 0)

                  return extensionsLogger(
                    apiOptions.requestIDs?.requestID || "",
                    apiName,
                    key,
                    { time, length, cached: false }
                  )
                })
                .then(resolve)
                .catch((error) => {
                  warn(key, error)
                  extensionsLogger(
                    options.requestIDs?.requestID || "",
                    apiName,
                    key,
                    { failed: true, error }
                  )
                  reject(error)
                })
            })

            return result
          })
        ),
      { cache: false, batch: false }
    )
    return loaderInterface(loader, path, globalParams)
  }
  return apiLoaderFactory as LoaderFactory
}

export const gravityUncachedLoaderFactory = (opts) =>
  unauthenticatedUncachedApiLoaderFactory(gravity, "gravity", {
    requestIDs: opts.requestIDs,
    userAgent: opts.userAgent,
    appToken: opts.appToken,
  })
