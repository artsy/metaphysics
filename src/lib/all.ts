import { times, flatten } from "lodash"
import { APIOptions } from "./loaders/api"

// TODO: Type this and refactor, because I think things just kinda work by luck,
//       because a static and a dynamic path loader take different number of
//       arguments.

export const MAX_GRAPHQL_INT = 2147483647

export const allViaLoader = (
  loader,
  options: {
    // For dynamic path loaders
    path?: string | { [key: string]: any }
    params?: { [key: string]: any }
    api?: APIOptions
  } = {}
) => {
  const params = options.params ? { size: 25, ...options.params } : { size: 25 }
  const invokeLoader = invocationParams =>
    options.path
      ? loader(options.path, invocationParams, options.api)
      : loader(invocationParams, options.api)
  const countParams = {
    ...params,
    page: 1,
    size: 0,
    total_count: true,
  }
  return invokeLoader(countParams)
    .then(({ headers }) => {
      const count = parseInt(headers["x-total-count"] || "0", 10)
      const pages = Math.ceil(count / params.size)
      return Promise.all(
        times(pages, i => {
          const pageParams = { ...params, page: i + 1 }
          return invokeLoader(pageParams).then(({ body }) => body)
        })
      )
    })
    .then(flatten)
}
