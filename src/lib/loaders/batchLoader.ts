import DataLoader from "dataloader"
import { chain } from "lodash"
import config from "config"
import { StaticPathLoader, DynamicPathLoader } from "./api/loader_interface"

const { ENABLE_RESOLVER_BATCHING } = config

interface IdWithParams {
  id: string
  [key: string]: any
}

type SerializedParams = string[]

interface BatchedParams {
  id: string[]
  [key: string]: any
}

/**
 *  This function is used by the dataloader to determine the uniqueness of keys.
 *  Because keys can be objects, it's important to be able to differentiate between
 *  their contents. If an object is empty except for an id field, we just use id.
 *  Otherwise we stringify the object so it can be compared via strict comparison.
 */
export const cacheKeyFn = (key: IdWithParams): string => {
  // If id is the *only* property of the key object
  if (Object.keys(key).length === 1) {
    return key.id
  }
  return JSON.stringify(key)
}

/**
 * This is just used to compare options sent into the dataloader.
 */
export const serializeParams = (key: IdWithParams) => {
  const { id, ...params } = key
  return Object.entries(params)
    .map((entry) => entry.join("="))
    .sort()
    .join("&")
}

/**
 * A tuple containing a list of stringify params (minus id) and
 * an array of arrays of params with Id. Each of the inner arrays
 * contain param objects that have all the same params besides id.
 */
type ParamGrouping = [SerializedParams, IdWithParams[][]]
/**
 * Takes an array of parameter objects and groups them by all their params except for id.
 * @returns a tuple of an array of group strings and an array of grouped keys
 */
export const groupByParams = (params: IdWithParams[]): ParamGrouping => {
  const paramGrouping = chain(params)
    .groupBy(serializeParams)
    .entries()
    .thru((entries) => {
      const result: ParamGrouping = [[], []]
      for (let i = 0; i < entries.length; ++i) {
        result[0].push(entries[i][0])
        result[1].push(entries[i][1])
      }
      return result
    })
    .value() as ParamGrouping

  return paramGrouping
}

/**
 * Takes an array of like parameters with different ids and joins them into one
 * object with an array of ids. This is the format that gravity's list endpoints
 * consume.
 */
export const flattenedParams = (keys: IdWithParams[]): BatchedParams => ({
  ...keys[0],
  id: keys.map((key) => key.id),
})

interface BatchLoaderArgs {
  /**
   * For resolvers designed to hit a list endpoint
   * leave this argument empty. List endpoints
   * support filtering options that single resource
   * endpoints do not.
   */
  singleLoader?: any
  multipleLoader: any
  /**
   * A reference of the DataLoader class, used primarily for dependency injection
   * in tests.
   */
  DL?: typeof DataLoader
}

export const batchLoader = ({
  singleLoader,
  multipleLoader,
  DL = DataLoader,
}: BatchLoaderArgs) => {
  if (!ENABLE_RESOLVER_BATCHING) {
    return singleLoader ? singleLoader : multipleLoader
  }
  const dl = new DL(
    async (idWithParamsList: IdWithParams[]) => {
      const [paramGroups, groupedParams] = groupByParams(idWithParamsList)
      const data = await Promise.all(
        groupedParams.map(flattenedParams).map((params) => {
          if (
            params.id.length === 1 &&
            singleLoader &&
            Object.keys(params).length === 1
          ) {
            return singleLoader(params.id[0])
          } else {
            return multipleLoader({ ...params, batched: true })
          }
        })
      )
      const normalizedData = data.map((datum) =>
        Array.isArray(datum) ? datum.reverse() : [datum]
      )
      const results = idWithParamsList.map((params) => {
        const paramGroup = serializeParams(params)
        const groupIndex = paramGroups.indexOf(paramGroup)
        return normalizedData[groupIndex].pop()
      })
      return results
    },
    {
      maxBatchSize: 20,
      cacheKeyFn,
    }
  )

  type Key = string | { id: string[] }

  /**
   * This is an abstraction around the data loader to keep api parity with the
   * existing gravityLoader api
   */
  return (key: Key) => {
    /**
     * This section covers the case when an endpoint is being requested that supports
     * parameters. An example would be the `sales` endpoint which has filters like
     * `live` or `is_auction`.
     *
     * The assumption here is that things are being requested from a list endpoint
     * so the results are always formatted into an array
     */
    if (typeof key === "object" && key !== null) {
      if (!key.id) {
        return multipleLoader(key)
      }
      if (key.id.length === 1) {
        return dl
          .load({ ...key, id: key.id[0] })
          .then((result) =>
            result === undefined || result === null ? [] : [result]
          )
      }

      return dl
        .loadMany(
          key.id.map((id) => ({
            ...key,
            id: id,
          }))
        )
        .then((results) => results.filter((result) => result !== null))
      /**
       * This section covers the case when a single resource endpoint is being requested.
       * Take the `sale` endpoint for example. `key` is expected to be a string of `id` or `slug`.
       */
    } else if (typeof key === "string") {
      return dl.load({ id: key })
    } else {
      throw new Error("Requested an invalid key type for batchLoader")
    }
  }
}

type PathLoader = StaticPathLoader<any> | DynamicPathLoader<any, any>

/**
 * @returns a tuple of a single batch loader and a multiple batch loader
 */
export const createBatchLoaders = <
  SL extends PathLoader,
  ML extends PathLoader
>({
  singleLoader,
  multipleLoader,
}: {
  singleLoader: SL
  multipleLoader: ML
}): [SL, ML] => {
  return [
    batchLoader({
      singleLoader,
      multipleLoader,
    }),
    batchLoader({
      multipleLoader,
    }),
  ]
}
