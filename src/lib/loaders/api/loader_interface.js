// @ts-check

import { toKey } from "lib/helpers"

const encodeStaticPath = (path, globalParams, params) =>
  {return toKey(path, Object.assign({}, globalParams, params))}

const encodeDynamicPath = (pathGenerator, globalParams, id, params) =>
  {return encodeStaticPath(pathGenerator(id), globalParams, params)}

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
export const loaderInterface = (loader, pathOrGenerator, globalParams) => {return (
  ...idAndOrParams
) => {
  const keyGenerator =
    typeof pathOrGenerator === "function" ? encodeDynamicPath : encodeStaticPath
  const key = keyGenerator(pathOrGenerator, globalParams, ...idAndOrParams)
  return loader.load(key)
}}
