import DataLoader from "dataloader"
import gravity from "lib/apis/gravity"
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
const loaderWithoutAuthentication = api => {
  return (path, globalParams = {}) => {
    const loader = cachingHttpLoader(api)
    return loaderInterface(loader, path, globalParams)
  }
}

const loaderWithAuthentication = api => {
  return accessToken => {
    return (path, apiOptions = {}, globalParams = {}) => {
      const loader = new DataLoader(
        keys => {
          return Promise.all(
            keys.map(key => {
              const clock = timer(path)
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
 * This loader caches all responses to memcache. Do NOT use this for authenticated requests!
 */
export const gravityLoaderWithoutAuthentication = loaderWithoutAuthentication(gravity)
export const positronLoaderWithoutAuthentication = loaderWithoutAuthentication(positron)

/**
 * This loader does cache responses for the duration of query execution but does not cache to memcache. Use this for
 * authenticated requests.
 */
export const gravityLoaderWithAuthentication = loaderWithAuthentication(gravity)
