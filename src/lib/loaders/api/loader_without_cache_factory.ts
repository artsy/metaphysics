import DataLoader from "dataloader"
import { loaderInterface } from "./loader_interface"
import { LoaderFactory } from "../index"
import { API, DataLoaderKey, APIOptions } from "./index"
import { warn } from "lib/loggers"
import gravity from "lib/apis/gravity"

/**
 * This factory provides a short-cut system for our data loader system, it provides
 * an uncached result that is close to the equivalent to calling the fetch request directly.
 *
 * @param {(string, any) => Promise<any>} api a function that performs an API request
 * @param {string} _apiName the name of the API service
 */

export const uncachedLoaderFactory = <T = any>(
  api: API,
  _apiName: string,
  apiOptions: APIOptions = {}
) => {
  const apiLoaderFactory = (path, params = {}) => {
    const loader = new DataLoader<DataLoaderKey, T | { body: T; headers: any }>(
      (keys) =>
        Promise.all<any>(
          keys.map(({ key }) => {
            const reduceData = ({ body, headers }) =>
              apiOptions && apiOptions.headers ? { body, headers } : body

            const callApi = () =>
              api(key, null, apiOptions)
                .then(reduceData)
                .catch((error) => {
                  warn(key, error)
                  throw error
                })

            return callApi()
          })
        ),
      { cache: false, batch: false }
    )
    return loaderInterface(loader, path, params)
  }
  return apiLoaderFactory as LoaderFactory
}

export const gravityUncachedLoaderFactory = (opts) =>
  uncachedLoaderFactory(gravity, "gravity", {
    requestIDs: opts.requestIDs,
    userAgent: opts.userAgent,
    appToken: opts.appToken,
  })
