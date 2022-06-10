import DataLoader from "dataloader"
import { loaderInterface } from "./loader_interface"
import { LoaderFactory } from "../index"
import { DataLoaderKey } from "./index"

/**
 * This factory provides a short-cut system for our data loader system, it provides
 * an uncached result that is close to the equivalent to calling the fetch request directly.
 *
 * @param {(string, any) => Promise<any>} api a function that performs an API request
 * @param {string} _apiName the name of the API service
 */

export const uncachedLoaderFactory = (
  api: (route: string, params) => Promise<any>,
  apiName: string
) => {
  const apiLoaderFactory = (path, options: any | null) => {
    // If you use gravity as the api here, then options will get interpreted as
    // an accessToken, so you have to explicitly pass null
    const loader = new DataLoader<DataLoaderKey, any>(
      (keys) =>
        Promise.all(
          keys.map(({ key, apiOptions }) => {
            if (apiOptions) {
              throw new Error("A uncachedLoader does not accept API options.")
            }

            const reduceData = ({ body, headers }) =>
              options && options.headers ? { body, headers } : body

            return Promise.resolve(
              api(key, apiName === "gravity" ? null : options).then(reduceData)
            )
          })
        ),
      { cache: false, batch: false }
    )
    return loaderInterface(loader, path, options)
  }
  return apiLoaderFactory as LoaderFactory
}
