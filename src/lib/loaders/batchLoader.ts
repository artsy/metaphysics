import DataLoader from "dataloader"
import { chain, groupBy, flatten, chunk } from "lodash"
import config from "config"

const { ENABLE_RESOLVER_BATCHING } = config

const renderParams = key => {
  if (typeof key === "string") {
    return ""
  }
  const { id, ...params } = key
  return Object.entries(params)
    .map(entry => entry.join("="))
    .sort()
    .join("&")
}

interface GroupKeysResult {
  id: string | string[]
  size: number
  [key: string]: any
}
const groupKeys = (requestedKeys: string | { id }): GroupKeysResult[] =>
  chain(requestedKeys)
    .groupBy(renderParams)
    .values()
    .map(values => chunk(values, 20))
    .flatten()
    .map((keys: string[] | { id }[]) => {
      if (typeof keys[0] === "string") {
        return { id: keys, size: keys.length }
      }
      return {
        // @ts-ignore
        ...keys[0],
        id: keys.map(k => k.id),
        size: keys.length,
      }
    })
    .value()

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
  const dl = new DataLoader(keys => {
    let groupedKeys = groupKeys(keys as any)

    return Promise.all(
      groupedKeys.map(keys => {
        console.log(keys.id)
        if (keys.id.length === 1 && singleLoader) {
          return singleLoader(keys)
        } else {
          return multipleLoader(keys).then(
            results => console.log("RESULT", results.length) || results
          )
        }
      })
    ).then(data => {
      const normalizedResults = data.map((queriedGroup, groupIndex) => {
        return groupedKeys[groupIndex].id.map(
          id => queriedGroup.find(r => r._id === id) || defaultResult
        )
      })
      return flatten(normalizedResults)
    })
  })

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
