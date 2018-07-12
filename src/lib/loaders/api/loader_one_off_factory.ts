import DataLoader from "dataloader"
import { loaderInterface } from "./loader_interface"

/**
 * This factory provides a short-cut system for our data loader system, it provides
 * an uncached result that is close to the equivalent to calling the fetch request directly.
 *
 * @param {(string, any) => Promise<any>} api a function that performs an API request
 * @param {string} _apiName the name of the API service
 * @param {string} path the path for the API call
 * @param {any} options values which should be passed into the fetch request
 */

export const loaderOneOffFactory = (
  api: (route: string, params) => Promise<any>,
  _apiName: string,
  path: string,
  options: any
) => {
  // If you use gravity as the api here, then options will get interpreted as
  // an accessToken, so you have to explicitly pass null
  const loader = new DataLoader(
    () => Promise.resolve([api(path, options).then(r => r.body)]),
    { cache: false }
  )
  return loaderInterface(loader, path, options)(options)
}
