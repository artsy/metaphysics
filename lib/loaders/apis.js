import gravity from "lib/apis/gravity"
import positron from "lib/apis/positron"
import { toKey } from "lib/helpers"
import cachingHttpLoader from "./legacy/http"

import DataLoader from "dataloader"

// TODO As we’re currently re-using the http loader as it was, it won’t support batching yet.
//      We should rework that once we’ve changed all resolve functions to only use per-type loaders.
const cachingAPILoader = (api, path) => {
  const loader = cachingHttpLoader(api)
  return (id, params) => {
    const key = toKey(typeof path === "function" ? path(id) : path, params)
    return loader.load(key)
  }
}

/**
 * This loader caches all responses to memcache. Do NOT use this for authenticated requests!
 */
export const gravityLoader = cachingAPILoader.bind(null, gravity)
export const positronLoader = cachingAPILoader.bind(null, positron)

/**
 * This loader does cache responses for the duration of query execution but does not cache to memcache. Use this for
 * authenticated requests.
 */
export const authenticatedGravityLoaderFactory = accessToken => {
  return (path, apiOptions = {}, globalParams = {}) => {
    const loader = new DataLoader(
      keys => {
        return Promise.all(
          keys.map(key => {
            console.log(key)
            // TODO basically replicate authenticated_http.js
            return gravity(key, accessToken, apiOptions).then(response => response.body)
          })
        )
      },
      {
        batch: true,
        cache: true,
      }
    )
    return (id, params = {}) => {
      const key = toKey(typeof path === "function" ? path(id) : path, Object.assign({}, globalParams, params))
      return loader.load(key)
    }
  }
}
