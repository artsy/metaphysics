// @ts-check

import DataLoader from "dataloader"
import { loaderInterface } from "./loader_interface"

/**
 * This factory provides a short-cut system for our data loader system, it provides
 * an uncached result that is close to the equivilent to calling the fetch request directly.
 *
 * @param {(string, any) => Promise<any>} api a function that performs an API request
 * @param {string} _apiName the name of the API service
 * @param {string} path the path for the API call
 * @param {any} options values which should be passed into the fetch request
 */

export const loaderOneOffFactory = (api, _apiName, path, options) => {
  const loader = new DataLoader(() => Promise.resolve([api(path, options).then(r => r.body)]), { cache: false })
  return loaderInterface(loader, path, options)(options)
}
