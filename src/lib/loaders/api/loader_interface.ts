import { toKey } from "lib/helpers"
import DataLoader from "dataloader"
import { APIOptions, DataLoaderKey } from "./index"

export type PathGenerator<T> = (data: T) => string

// TODO: This should be more specific to take types that are serializeable.
type ParamValue = any

export type StaticPathLoader<T> = (
  params?: { [key: string]: ParamValue },
  apiOptions?: APIOptions
) => Promise<T>

export type DynamicPathLoader<T, P = string> = (
  id: P,
  params?: { [key: string]: ParamValue },
  apiOptions?: APIOptions
) => Promise<T>

const encodeStaticPath = (
  path: string,
  globalParams,
  params,
  method = "GET"
) => {
  if (method === "GET") {
    return toKey(path, Object.assign({}, globalParams, params))
  } else {
    return path
  }
}

const encodeDynamicPath = (
  pathGenerator: (id: string) => string,
  globalParams,
  id,
  params,
  method
) => {
  return encodeStaticPath(pathGenerator(id), globalParams, params, method)
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
  loader: DataLoader<DataLoaderKey, T>,
  pathOrGenerator: string,
  globalParams: any,
  method?: string
): StaticPathLoader<T>

export function loaderInterface<T, P>(
  loader: DataLoader<DataLoaderKey, T>,
  pathOrGenerator: PathGenerator<P>,
  globalParams: any,
  method?: string
): DynamicPathLoader<T>

export function loaderInterface<T, P>(
  loader: DataLoader<DataLoaderKey, T>,
  pathOrGenerator: string | PathGenerator<P>,
  globalParams: any,
  method?: string
) {
  const dynamicPath = typeof pathOrGenerator === "function"
  const keyGenerator: any = dynamicPath ? encodeDynamicPath : encodeStaticPath
  return (...args) => {
    const key = keyGenerator(pathOrGenerator, globalParams, ...args, method)
    const apiOptions = dynamicPath ? args[2] : args[1]

    // These options are passed to `fetch.ts`, and the keys:
    // `body`, `json` correspond to options to the underlying `request` library.
    const fetchOptions = { method, body: args[0], json: true }

    return loader.load({
      key,
      apiOptions: Object.assign({}, fetchOptions, apiOptions),
    })
  }
}
