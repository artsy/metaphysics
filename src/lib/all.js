// @ts-check

import { assign, times, flatten } from "lodash"
import total from "./loaders/legacy/total"
import gravity from "./loaders/legacy/gravity"

export const all = (path, options = {}) => {
  return total(path, options)
    .then(n => {
      const pages = Math.ceil(n / (options.size || 25))
      return Promise.all(times(pages, i => gravity(path, assign({}, options, { page: i + 1 }))))
    })
    .then(flatten)
}

export default all
