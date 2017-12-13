// @ts-check

import DataLoader from "dataloader"
import { pick } from "lodash"

import { loaderInterface } from "./loader_interface"
import timer from "lib/timer"
import { verbose, error } from "lib/loggers"
import logger from "lib/loaders/api/logger"

/**
 * This returns a function that takes an access token to create a data loader factory for the given `api`.
 *
 * The access token should be provided by a function which returns a `Promise` that produces the token. This function is
 * called lazily, so no requests will be made to e.g. Gravity to fetch a token until really needed.
 *
 * The data loaders produced by this factory do cache data for the duration of the query execution, but do not cache
 * data to memcache.
 *
 * @param {(path: string, token: string, apiOptions: any) => Promise<any>} api a function that performs an API request
 * @param {string} apiName a function that performs an API request
 * @param {any} globalAPIOptions options that need to be passed to any API loader created with this factory
 */
export const apiLoaderWithAuthenticationFactory = (api, apiName, globalAPIOptions) => {
  return accessTokenLoader => {
    return (path, globalParams = {}, pathAPIOptions = {}) => {
      const apiOptions = Object.assign({}, globalAPIOptions, pathAPIOptions)
      const loader = new DataLoader(
        keys => {
          return accessTokenLoader().then(accessToken =>
            Promise.all(
              keys.map(key => {
                const clock = timer(key)
                clock.start()
                return new Promise((resolve, reject) => {
                  verbose(`Requested: ${key}`)
                  api(key, accessToken, apiOptions)
                    .then(response => {
                      if (apiOptions.headers) {
                        resolve(pick(response, ["body", "headers"]))
                      } else {
                        resolve(response.body)
                      }
                      const time = clock.end()
                      logger(globalAPIOptions.requestIDs.requestID, apiName, key, { time, cache: false })
                    })
                    .catch(err => {
                      error(path, err)
                      reject(err)
                    })
                })
              })
            )
          )
        },
        {
          batch: true,
          cache: true,
        }
      )
      return loaderInterface(loader, path, globalParams)
    }
  }
}
