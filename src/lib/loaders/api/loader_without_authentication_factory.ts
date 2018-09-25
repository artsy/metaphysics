import DataLoader from "dataloader"
import { pick } from "lodash"

import { loaderInterface } from "./loader_interface"
import cache from "lib/cache"
import timer from "lib/timer"
import { throttled } from "lib/throttle"
import { verbose, warn } from "lib/loggers"
import logger from "lib/loaders/api/logger"
import config from "config"

const { CACHE_DISABLED } = config

// TODO Signatures for when we move to TypeScript (may not be 100% correct)
//
// type apiSignature = (path: string, accessToken?: string, options?: Object) => Promise<{ body: Object }>
// type apiLoaderWithAuthenticationFactoryType = (accessTokenLoader: () => Promise<string>) =>
//                                                 (path: string, apiOptions?: Object, globalParams?: Object) =>
//                                                   Promise<{ body: Object }>

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
export const apiLoaderWithoutAuthenticationFactory = (
  api: (path: string, token: string | null, apiOptions: any) => Promise<any>,
  apiName: string,
  globalAPIOptions: any = {}
) => {
  return (path, globalParams = {}, pathAPIOptions = {}) => {
    const apiOptions = Object.assign({}, globalAPIOptions, pathAPIOptions)
    const loader = new DataLoader(
      (keys: string[]) =>
        Promise.all(
          keys.map(key => {
            const clock = timer(key)
            clock.start()
            return new Promise((resolve, reject) => {
              if (!CACHE_DISABLED) {
                return cache.get(key).then(
                  // Cache hit
                  data => {
                    // Return cached data first
                    if (apiOptions.headers) {
                      resolve(pick(data, ["body", "headers"]))
                    } else {
                      resolve(data)
                    }
                    verbose(`Cached: ${key}`)

                    const time = clock.end()
                    logger(
                      globalAPIOptions.requestIDs.requestID,
                      apiName,
                      key,
                      {
                        time,
                        cache: true,
                      }
                    )

                    // Then refresh cache
                    return throttled(
                      key,
                      () => {
                        api(key, null, apiOptions)
                          .then(({ body, headers }) => {
                            verbose(`Refreshing: ${key}`)

                            if (apiOptions.headers) {
                              return cache.set(key, { body, headers })
                            } else {
                              return cache.set(key, body)
                            }
                          })
                          .catch(err => {
                            if (err.statusCode === 404) {
                              // Unpublished
                              cache.delete(key)
                            }
                          })
                      },
                      { requestThrottleMs: apiOptions.requestThrottleMs }
                    )
                  },
                  // Cache miss
                  () => {
                    api(key, null, apiOptions)
                      .then(({ body, headers }) => {
                        if (apiOptions.headers) {
                          resolve({ body, headers })
                        } else {
                          resolve(body)
                        }
                        verbose(`Requested (Uncached): ${key}`)
                        const time = clock.end()
                        logger(
                          globalAPIOptions.requestIDs.requestID,
                          apiName,
                          key,
                          { time, cache: false }
                        )
                        if (apiOptions.headers) {
                          return cache.set(key, { body, headers })
                        } else {
                          return cache.set(key, body)
                        }
                      })
                      .catch(err => {
                        warn(key, err)
                        reject(err)
                      })
                  }
                )
              } else {
                return api(key, null, apiOptions)
                  .then(({ body, headers }) => {
                    if (apiOptions.headers) {
                      resolve({ body, headers })
                    } else {
                      resolve(body)
                    }
                    verbose(`Requested (Uncached): ${key}`)
                    const time = clock.end()
                    logger(
                      globalAPIOptions.requestIDs.requestID,
                      apiName,
                      key,
                      { time, cache: false }
                    )
                  })
                  .catch(err => {
                    warn(key, err)
                    reject(err)
                  })
              }
            })
          })
        ),
      {
        batch: false,
        cache: true,
      }
    )
    return loaderInterface(loader, path, globalParams)
  }
}
