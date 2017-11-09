// Edits global saying where
export const logger = apiName => {
  if (global.requestInfoCache) {
    const cache = global.requestInfoCache
    if (cache[apiName]) {
      cache[apiName] = cache[apiName]++
    } else {
      cache[apiName] = 1
    }
  }
}
