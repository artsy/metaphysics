// @ts-check

import DataLoader from "dataloader"
import { loaderInterface } from "./loader_interface"

/**
 * This factory provides a short-cut system for our data loader system, it provides
 * and uncached result that is close the the equivilent to calling the fetch request directly.
 *
 * @param {(string, any) => Promise<any>} api a function that performs an API request
 * @param {string} path the path for the API call
 * @param {any} options values which should be passed into the fetch request
 */

export const loaderOneOffFactory = (api, path, options) => {
  const loader = new DataLoader(() => Promise.resolve([api(path, options).then(r => r.body)]), { cache: false })
  return loaderInterface(loader, path, options)(options)
}
