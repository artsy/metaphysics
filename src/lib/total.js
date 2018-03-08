import { assign } from "lodash"
import { isExisty } from "./helpers"

export const totalViaLoader = (loader, loaderOptions, apiOptions = {}) => {
  const countOptions = assign({}, apiOptions, {
    size: 0,
    total_count: true,
  })
  let fetch = null
  if (isExisty(loaderOptions)) {
    fetch = loader(loaderOptions, countOptions)
  } else {
    fetch = loader(countOptions)
  }
  return fetch.then(({ headers }) => {
    return parseInt(headers["x-total-count"] || 0, 10)
  })
}
