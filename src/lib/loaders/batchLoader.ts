import DataLoader from "dataloader"
import { chain } from "lodash"
import config from "config"

const { ENABLE_RESOLVER_BATCHING } = config

interface NormalKey {
  id: string
  [key: string]: any
}

type Key = string | NormalKey

type KeyGroupList = string[]

interface CompactedKey {
  id: string[]
  [key: string]: any
}

interface GravityResult {
  _id: string
  _slug: string
  [key: string]: any
}

/**
 *  This function is used by the dataloader to determine the uniqueness of keys.
 *  Because keys can be objects, it's important to be able to differentiate between
 *  their contents. If an object is empty except for an id field, we just use id.
 *  Otherwise we stringify the object so it can be compared via strict comparison.
 */
export const cacheKeyFn = (key: Key): string => {
  if (typeof key === "object" && key !== null) {
    if (Object.keys(key).length === 1 && key.id) {
      return key.id
    }
    return JSON.stringify(key)
  }
  return key
}

/**
 * This coerces all keys to an object structure for consistent processing
 */
export const normalizeKeys = (keys: Key[]) =>
  keys.map(key => (typeof key === "string" ? { id: key } : key))

/**
 * This is just used to compare options sent into the dataloader.
 * If the options are an object this stingifies the object in a way
 * that they can be grouped as similar.
 */
export const getKeyGroup = key => {
  if (typeof key === "string") {
    return ""
  }
  const { id, ...params } = key
  return Object.entries(params)
    .map(entry => entry.join("="))
    .sort()
    .join("&")
}

/**
 * Takes an array of normalized keys and groups them based on their parameters.
 * @returns a tuple of an array of group strings and an array of grouped keys
 */
export const groupKeys = (requestedKeys): [KeyGroupList, NormalKey[][]] => {
  const [keyGroupList, groupedKeys] = chain(requestedKeys)
    .groupBy(getKeyGroup)
    .entries()
    .thru(entries => {
      const result: [KeyGroupList, NormalKey[][]] = [[], []]
      for (let i = 0; i < entries.length; ++i) {
        result[0].push(entries[i][0])
        result[1].push(entries[i][1])
      }
      return result
    })
    .value()

  return [keyGroupList, groupedKeys]
}

/**
 * Collects all the params into one object to be passed to gravity loader
 */
export const compactKeyForRequest = (keys: NormalKey[]): CompactedKey => ({
  ...keys[0],
  id: keys.map(key => key.id),
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
  defaultResult?: any
}

export const batchLoader = ({
  singleLoader,
  multipleLoader,
  defaultResult = null,
}: BatchLoaderArgs) => {
  if (!ENABLE_RESOLVER_BATCHING) {
    return singleLoader ? singleLoader : multipleLoader
  }
  const dl = new DataLoader(
    (keys: Key[]) => {
      const normalKeys = normalizeKeys(keys)
      const [keyGroups, groupedKeys] = groupKeys(normalKeys)

      return Promise.all(
        groupedKeys.map(compactKeyForRequest).map(keys => {
          if (keys.id.length === 1 && singleLoader) {
            return singleLoader(keys.id[0])
          } else {
            return multipleLoader(keys)
          }
        })
      ).then((data: Array<GravityResult | GravityResult[]>) => {
        const normalizedData = data.map(
          datum => (Array.isArray(datum) ? datum : [datum])
        )

        return normalKeys.map(key => {
          const group = getKeyGroup(key)
          const groupIndex = keyGroups.indexOf(group)
          return (
            normalizedData[groupIndex].find(
              ({ _id, _slug }) => key.id === _id || key.id === _slug
            ) || defaultResult
          )
        })
      })
    },
    {
      maxBatchSize: 20,
      cacheKeyFn,
    }
  )

  return key => dl.load(key)
}

/**
 * @returns a tuple of a single batch loader and a multiple batch loader
 */
export const createBatchLoaders = ({
  singleLoader,
  multipleLoader,
  singleDefault,
  multipleDefault,
}) => {
  return [
    batchLoader({
      singleLoader,
      multipleLoader,
      defaultResult: singleDefault,
    }),
    batchLoader({
      multipleLoader,
      defaultResult: multipleDefault,
    }),
  ]
}
