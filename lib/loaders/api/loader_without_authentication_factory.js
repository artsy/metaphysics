import DataLoader from "dataloader"

import { loaderInterface } from "./loader_interface"
import cache from "lib/cache"
import timer from "lib/timer"
import { throttled } from "lib/throttle"
import { verbose, error } from "lib/loggers"

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
 * @param {apiSignature} api a function that performs an API request
 * @param {object} globalAPIOptions options that need to be passed to any API loader created with this factory
 */
export const apiLoaderWithoutAuthenticationFactory = (api, globalAPIOptions = {}) => {
  return (path, globalParams = {}, pathAPIOptions = {}) => {
    const apiOptions = Object.assign({}, globalAPIOptions, pathAPIOptions)
    const loader = new DataLoader(
      keys =>
        Promise.all(
          keys.map(key => {
            const clock = timer(key)
            clock.start()

            return new Promise((resolve, reject) => {
              cache.get(key).then(
                // Cache hit
                data => {
                  // Return cached data first
                  resolve(data)
                  verbose(`Cached: ${key}`)
                  clock.end()

                  // Then refresh cache
                  throttled(key, () => {
                    api(key, null, apiOptions)
                      .then(({ body }) => {
                        verbose(`Refreshing: ${key}`)
                        cache.set(key, body)
                      })
                      .catch(err => {
                        if (err.statusCode === 404) {
                          // Unpublished
                          cache.delete(key)
                        }
                      })
                  })
                },
                // Cache miss
                () => {
                  api(key, null, apiOptions)
                    .then(({ body }) => {
                      resolve(body)
                      verbose(`Requested (Uncached): ${key}`)
                      clock.end()
                      cache.set(key, body)
                    })
                    .catch(err => {
                      reject(err)
                      error(key, err)
                    })
                }
              )
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
