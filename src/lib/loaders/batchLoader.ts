import DataLoader from "dataloader"
import { groupBy, flatten } from "lodash"
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
    let groupedKeys = Object.values(groupBy(keys, renderParams)).map(keys => {
      if (typeof keys[0] === "string") {
        return { id: keys, size: keys.length }
      }
      return {
        ...keys[0],
        id: keys.map(k => k.id),
        size: keys.length,
      }
    })

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
