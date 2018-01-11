import config from "config"

export const requesting = {}

export const throttled = (key, fn, opts = {}) => {
  if (requesting[key]) return
  fn()
  requesting[key] = true
  const timeoutValue = opts.requestThrottleMs || config.REQUEST_THROTTLE_MS
  setTimeout(() => {
    delete requesting[key]
  }, timeoutValue)
}
