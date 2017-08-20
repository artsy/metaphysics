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

/**
 * This implements the common interface for producing data loaders for each api/path, regardless of authentication.
 *
 * If `path` is a string, then the loader will accept only query params as its parameters. For example:
 *
 *    const artworksLoader = gravityLoader("artworks")
 *    artworksLoader({ page: 42 })
 *
 * If `path` is a function, then the loader accepts an ID _and_ query params as its parameters. For example:
 *
 *    const artistArtworksLoader = gravityLoader(id => `artist/${id}/artworks`)
 *    artistArtworksLoader("banksy", { page: 42 })
 *
 * @param {DataLoader} loader a DataLoader instance from which to load
 * @param {string|function} path a query path
 * @param {object} globalParams a dictionary of query params that are to be included in each request
 */
const loaderInterface = (loader, path, globalParams) => (...id_and_or_params) => {
  const dynamicPath = typeof path === "function"
  let id = null
  let params = null
  if (dynamicPath) {
    ;[id, ...params] = id_and_or_params // eslint-disable-line no-extra-semi
  } else {
    params = id_and_or_params[0]
  }
  const key = toKey(dynamicPath ? path(id) : path, Object.assign({}, globalParams, params))
  return loader.load(key)
}

/**
 * This returns a data loader factory for the given `api`.
 *
 * The data loaders produced by this factory do cache data for the duration of the query execution, but do not cache
 * data to memcache.
 *
 * @param {(path, accessToken, options) => Promise} api a function that performs an API request
 *
 * @todo As we’re currently re-using the http loader as it was, it won’t support batching yet.
 *       We should rework that once we’ve changed all resolve functions to only use per-type loaders.
 * @todo apiOptions is currently unused.
 */
export const apiLoaderWithoutAuthenticationFactory = api => {
  return (path, apiOptions = {}, globalParams = {}) => {
    const loader = cachingHttpLoader(api)
    return loaderInterface(loader, path, globalParams)
  }
}

// TODO Signatures for when we move to TypeScript (may not be 100% correct)
//
// type apiSignature = (path: string, accessToken?: string, options?: Object) => Promise<{ body: Object }>
// type apiLoaderWithAuthenticationFactoryType = (accessTokenLoader: () => Promise<string>) =>
//                                                 (path: string, apiOptions?: Object, globalParams?: Object) =>
//                                                   Promise<{ body: Object }>

/**
 * This returns a function that takes an access token to create a data loader factory for the given `api`.
 *
 * The access token should be provided by a function that returns a `Promise` that produces the token.
 *
 * The data loaders produced by this factory do cache data for the duration of the query execution, but do not cache
 * data to memcache.
 *
 * @param {apiSignatur} api a function that performs an API request
 * @return {apiLoaderWithAuthenticationFactoryType}
 */
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
 * The Gravity loaders produced by this factory _will_ cache all responses to memcache.
 *
 * Do **not** use it for authenticated requests!
 */
export const gravityLoaderWithoutAuthenticationFactory = apiLoaderWithoutAuthenticationFactory(gravity)

/**
 * The Positron loaders produced by this factory _will_ cache all responses to memcache.
 *
 * Do **not** use it for authenticated requests!
 */
export const positronLoaderWithoutAuthenticationFactory = apiLoaderWithoutAuthenticationFactory(positron)

/**
 * The Gravity loaders produced by this factory _will_ cache responses for the duration of query execution but do
 * **not** cache to memcache.
 *
 * Use this for authenticated requests.
 */
export const gravityLoaderWithAuthenticationFactory = apiLoaderWithAuthenticationFactory(gravity)

/**
 * The Impulse loaders produced by this factory _will_ cache responses for the duration of query execution but do
 * **not** cache to memcache.
 *
 * Use this for authenticated requests.
 */
export const impulseLoaderWithAuthenticationFactory = apiLoaderWithAuthenticationFactory(impulse)
