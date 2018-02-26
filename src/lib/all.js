// @ts-check

import { assign, times, flatten } from "lodash"
import total from "./loaders/legacy/total"
import gravity from "./loaders/legacy/gravity"

export const all = (path, options = {}) => {
  return total(path, options)
    .then(n => {
      const pages = Math.ceil(n / (options.size || 25))
      return Promise.all(
        times(pages, i => gravity(path, assign({}, options, { page: i + 1 })))
      )
    })
    .then(flatten)
}

export const allViaLoader = (loader, loaderOptions, apiOptions = {}) => {
  const countOptions = assign({}, apiOptions, {
    page: 1,
    size: 0,
    total_count: true,
  })
  return loader(loaderOptions, countOptions)
    .then(({ headers }) => {
      const count = parseInt(headers["x-total-count"] || 0, 10)
      const pages = Math.ceil(count / (apiOptions.size || 25))
      return Promise.all(
        times(pages, i => {
          return loader(
            loaderOptions,
            assign({}, apiOptions, { page: i + 1 })
          ).then(({ body }) => body)
        })
      )
    })
    .then(flatten)
}

export default all
