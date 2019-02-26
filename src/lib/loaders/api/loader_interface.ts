import { toKey } from "lib/helpers"
import DataLoader from "dataloader"

export type PathGenerator<T> = (data: T) => string

// TODO: This should be more specific to take types that are serializeable.
type ParamValue = any

interface APIOptions {
  requestThrottleMs: number
}

export type StaticPathLoader<T> = (
  params?: { [key: string]: ParamValue },
  apiOptions?: APIOptions
) => Promise<T>

export type DynamicPathLoader<T, P = string> = (
  id: P,
  params?: { [key: string]: ParamValue },
  apiOptions?: APIOptions
) => Promise<T>

const encodeStaticPath = (path: string, globalParams, params) => {
  return toKey(path, Object.assign({}, globalParams, params))
}

const encodeDynamicPath = (
  pathGenerator: (id: string) => string,
  globalParams,
  id,
  params
) => {
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

export function loaderInterface<T>(
  loader: DataLoader<string, T>,
  pathOrGenerator: string,
  globalParams: any
): StaticPathLoader<T>

export function loaderInterface<T, P>(
  loader: DataLoader<string, T>,
  pathOrGenerator: PathGenerator<P>,
  globalParams: any
): DynamicPathLoader<T>

export function loaderInterface<T, P>(
  loader: DataLoader<string, T>,
  pathOrGenerator: string | PathGenerator<P>,
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
