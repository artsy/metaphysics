// Edits global saying where

let requests = null

export default (host, key) => {
  const cache = requests
  if (cache) {
    if (!cache[host]) {
      cache[host] = {
        requests: [],
        count: 0,
      }
    }

    // Remove empty trailing `?`s
    const safeKey = key.replace(/(\?$)/, "")
    cache[host].requests.push(safeKey)
    cache[host].count = cache[host].requests.length
  }
}

// This will only be triggered in non-production environments
export const fetchLoggerSetup = () => {
  requests = {}
}

// Called at the end of a request, returns the results and resets
export const fetchLoggerRequestDone = () => {
  const requestCopy = requests
  requests = {}
  return {
    requests: requestCopy,
  }
}
