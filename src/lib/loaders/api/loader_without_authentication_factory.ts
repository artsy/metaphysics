import DataLoader from "dataloader"

import { loaderInterface } from "./loader_interface"
import cache, { CacheOptions } from "lib/cache"
import timer from "lib/timer"
import { verbose, warn } from "lib/loggers"
import extensionsLogger, { formatBytes } from "lib/loaders/api/extensionsLogger"
import config from "config"
import { API, DataLoaderKey, APIOptions } from "./index"
import { LoaderFactory } from "../index"

const { CACHE_DISABLED } = config

// TODO Signatures for when we move to TypeScript (may not be 100% correct)
//
// type apiSignature = (path: string, accessToken?: string, options?: Object) => Promise<{ body: Object }>
// type apiLoaderWithAuthenticationFactoryType = (accessTokenLoader: () => Promise<string>) =>
//                                                 (path: string, apiOptions?: Object, globalParams?: Object) =>
//                                                   Promise<{ body: Object }>

function tap(cb) {
  return data => {
    cb(data)
    return data
  }
}

/**
 * This returns a data loader factory for the given `api`.
 *
 * The data loaders produced by this factory do cache data for the duration of the query execution, but do not cache
 * data to memcache.
 *
 * @param {(path: string, token: string | null, apiOptions: any) => Promise<any>} api an API request function
 * @param {string} apiName The API service name
 * @param {any} globalAPIOptions options that need to be passed to any API loader created with this factory
 */
export const apiLoaderWithoutAuthenticationFactory = <T = any>(
  api: API,
  apiName: string,
  globalAPIOptions: APIOptions = {}
) => {
  const apiLoaderFactory = (path, globalParams = {}, pathAPIOptions = {}) => {
    const loader = new DataLoader<DataLoaderKey, T | { body: T; headers: any }>(
      keys =>
        Promise.all<any>(
          keys.map(({ key, apiOptions: invocationAPIOptions }) => {
            const apiOptions = {
              ...globalAPIOptions,
              ...pathAPIOptions,
              ...invocationAPIOptions,
            }

            const clock = timer(key)
            clock.start()

            const finish = ({
              message,
              cached,
            }: {
              message: string
              /**
               * Omit when ran outside of the HTTP request, otherwise specify if
               * the data was loaded from the cache.
               */
              cached?: boolean
            }) =>
              tap(data => {
                verbose(message)
                const time = clock.end()
                if (
                  cached !== undefined &&
                  // TODO: Should these be required and enforced through types?
                  globalAPIOptions.requestIDs &&
                  globalAPIOptions.requestIDs.requestID
                ) {
                  extensionsLogger(
                    globalAPIOptions.requestIDs.requestID,
                    apiName,
                    key,
                    {
                      time,
                      cache: cached,
                      length:
                        !cached &&
                        data.headers &&
                        data.headers["content-length"]
                          ? formatBytes(data.headers["content-length"])
                          : "N/A",
                    }
                  )
                }
              })

            const callApi = () =>
              api(key, null, apiOptions).catch(err => {
                warn(key, err)
                throw err
              })

            const reduceData = ({ body, headers }) =>
              apiOptions.headers ? { body, headers } : body

            const cacheData = (data, options: CacheOptions) => {
              cache.set(key, data, options).catch(err => warn(key, err))
              return data
            }

            // Short-circuits any reading or writing to the cache.
            const skipCache =
              CACHE_DISABLED ||
              (apiOptions.method &&
                ["PUT", "POST", "DELETE"].includes(apiOptions.method))

            if (skipCache) {
              return callApi()
                .then(
                  finish({
                    message: `Requested (Uncached): ${key}`,
                    cached: false,
                  })
                )
                .then(reduceData)
            } else {
              // No need to run reduceData on a cache fetch.
              return (
                cache
                  .get(key)
                  // Cache hit
                  .then(
                    finish({
                      message: `Cached: ${key}`,
                      cached: true,
                    })
                  )
                  // Cache miss.
                  .catch(() => {
                    const cacheOptions: CacheOptions = {}
                    if (apiOptions.requestThrottleMs) {
                      cacheOptions.cacheTtlInSeconds =
                        apiOptions.requestThrottleMs / 1000
                    }
                    return callApi()
                      .then(
                        finish({
                          message: `Requested (Uncached): ${key}`,
                          cached: false,
                        })
                      )
                      .then(reduceData)
                      .then(data => cacheData(data, cacheOptions))
                  })
              )
            }
          })
        ),
      {
        batch: false,
        cache: true,
        cacheKeyFn: input => JSON.stringify(input),
      }
    )
    return loaderInterface(loader, path, globalParams)
  }
  return apiLoaderFactory as LoaderFactory
}
