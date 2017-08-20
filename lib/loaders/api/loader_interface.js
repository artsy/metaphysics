import { toKey } from "lib/helpers"

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
export const loaderInterface = (loader, path, globalParams) => (...id_and_or_params) => {
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
