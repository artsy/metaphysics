import DataLoader from "dataloader"
import { loaderInterface } from "./loader_interface"
import { LoaderFactory } from "../index"
import { APIOptions, DataLoaderKey } from "./index"
import timer from "lib/timer"
import { verbose } from "lib/loggers"
import extensionsLogger from "./extensionsLogger"

/**
 * This factory provides a short-cut system for our data loader system, it provides
 * an uncached result that is close to the equivalent to calling the fetch request directly.
 *
 * @param {(string, any) => Promise<any>} api a function that performs an API request
 * @param {string} _apiName the name of the API service
 */

function tap(cb) {
  return (data) => {
    cb(data)
    return data
  }
}

export const uncachedLoaderFactory = (
  api: (route: string, params) => Promise<any>,
  apiName: string,
  globalAPIOptions: APIOptions = {}
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

            const finish = ({ message }: { message: string }) =>
              tap(() => {
                verbose(message)
                const time = clock.end()

                if (globalAPIOptions.requestIDs) {
                  extensionsLogger(
                    globalAPIOptions.requestIDs.requestID,
                    apiName,
                    key,
                    {
                      time,
                    }
                  )
                }
              })

            const clock = timer(key)
            clock.start()

            return Promise.resolve(
              api(key, apiName === "gravity" ? null : options)
                .then(finish({ message: `Requested: ${key}` }))
                .then(reduceData)
            )
          })
        ),
      { cache: false, batch: false }
    )
    return loaderInterface(loader, path, options)
  }
  return apiLoaderFactory as LoaderFactory
}
