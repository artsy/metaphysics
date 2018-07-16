import DataLoader from "dataloader"
import { loaderInterface, FuncToString } from "./loader_interface"

/**
 * This factory provides a short-cut system for our data loader system, it provides
 * an uncached result that is close to the equivalent to calling the fetch request directly.
 *
 * @param {(string, any) => Promise<any>} api a function that performs an API request
 * @param {string} _apiName the name of the API service
 */

export const uncachedLoaderFactory = (
  api: (route: string, params) => Promise<any>,
  _apiName: string
) => (path: string | FuncToString, options: any | null) => {
  // If you use gravity as the api here, then options will get interpreted as
  // an accessToken, so you have to explicitly pass null
  const loader = new DataLoader(
    ([route]) =>
      Promise.resolve([api(route as string, options).then(r => r.body)]),
    { cache: false }
  )
  return loaderInterface(loader, path, options)
}
//
