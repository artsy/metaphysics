// @ts-check

import { toKey } from "lib/helpers"
import DataLoader from "dataloader"

const encodeStaticPath = (path, globalParams, params) => {
  return toKey(path, Object.assign({}, globalParams, params))
}

const encodeDynamicPath = (pathGenerator, globalParams, id, params) => {
  return encodeStaticPath(pathGenerator(id), globalParams, params)
}

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
 * @param {string|function} pathOrGenerator a query path or function that generates one
 * @param {object} globalParams a dictionary of query params that are to be included in each request
 */

export function loaderInterface<R>(
  loader: DataLoader<string, R>,
  pathOrGenerator: () => string | string,
  globalParams: any
) {
  return (...idAndOrParams) => {
    const keyGenerator: any =
      typeof pathOrGenerator === "function"
        ? encodeDynamicPath
        : encodeStaticPath

    const key = keyGenerator(pathOrGenerator, globalParams, ...idAndOrParams)
    return loader.load(key)
  }
}

// export const loaderInterface = (
//   loader: DataLoader<string, any>,
//   pathOrGenerator: () => string | string,
//   globalParams: any
// ) => (...idAndOrParams) => {
//   const keyGenerator: any =
//     typeof pathOrGenerator === "function" ? encodeDynamicPath : encodeStaticPath

//   const key = keyGenerator(pathOrGenerator, globalParams, ...idAndOrParams)
//   return loader.load(key)
// }
