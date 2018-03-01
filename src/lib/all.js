// @ts-check

import { assign, times, flatten } from "lodash"

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
