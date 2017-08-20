import DataLoader from "dataloader"
import gravity from "lib/apis/gravity"
import impulse from "lib/apis/impulse"
import positron from "lib/apis/positron"
import { toKey } from "lib/helpers"

import timer from "lib/timer"
import { verbose, error } from "lib/loggers"
import { pick } from "lodash"

// FIXME This legacy loader needs to be removed.
import cachingHttpLoader from "./legacy/http"

const loaderInterface = (loader, path, globalParams) => (id, params = {}) => {
  const key = toKey(typeof path === "function" ? path(id) : path, Object.assign({}, globalParams, params))
  return loader.load(key)
}

// TODO As we’re currently re-using the http loader as it was, it won’t support batching yet.
//      We should rework that once we’ve changed all resolve functions to only use per-type loaders.
//
// TODO apiOptions is currently unused.
//
export const apiLoaderWithoutAuthenticationFactory = api => {
  return (path, apiOptions = {}, globalParams = {}) => {
    const loader = cachingHttpLoader(api)
    return loaderInterface(loader, path, globalParams)
  }
}

export const apiLoaderWithAuthenticationFactory = api => {
  return accessTokenLoader => {
    return (path, apiOptions = {}, globalParams = {}) => {
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
                      clock.end()
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

/**
 * These loaders cache all responses to memcache. Do NOT use these for authenticated requests!
 */
export const gravityLoaderWithoutAuthenticationFactory = apiLoaderWithoutAuthenticationFactory(gravity)
export const positronLoaderWithoutAuthenticationFactory = apiLoaderWithoutAuthenticationFactory(positron)

/**
 * These loaders do cache responses for the duration of query execution but do not cache to memcache. Use this for
 * authenticated requests.
 */
export const gravityLoaderWithAuthenticationFactory = apiLoaderWithAuthenticationFactory(gravity)
export const impulseLoaderWithAuthenticationFactory = apiLoaderWithAuthenticationFactory(impulse)
