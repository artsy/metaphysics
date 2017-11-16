// @ts-check

import DataLoader from "dataloader"
import { loaderInterface } from "./loader_interface"

/**
 * This factory provides a short-cut system for our data loader system, it provides
 * and uncached result that is close to the equivilent to calling the fetch request directly.
 *
 * @param {(path: string, token: string | null, apiOptions: any) => Promise<any>} api an API request function
 * @param {any} globalAPIOptions options that need to be passed to any API loader created with this factory
 */

export const loaderOneOffFactory = (api, globalAPIOptions = {}) => {
  return (path, globalParams = {}, pathAPIOptions = {}) => {
    const apiOptions = Object.assign({}, globalAPIOptions, pathAPIOptions)
    const loader = new DataLoader(
      keys => Promise.all(keys.map(key => Promise.resolve(api(key, null, apiOptions).then(r => r.body)))),
      {
        cache: false,
      }
    )
    return loaderInterface(loader, path, globalParams)
  }
}
