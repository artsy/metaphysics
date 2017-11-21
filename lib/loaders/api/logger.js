// @ts-check

// Edits global saying where

// Looks a like:
// { '518330f0-ce2a-11e7-a26e-f992b926b95f': { gravity: { requests: [...], count: 1 } } }

const requests = {}

/**
 * A logger for calls to external APIs
 *
 * @param requestID {string} the ID for the request
 * @param host {string} the type of server
 * @param key {string} basically query string for the call
 * @param metadata {any} any additional details to go along
 */
const logger = (requestID, host, key, metadata) => {
  if (requests[requestID]) {
    const cache = requests[requestID]

    if (!cache[host]) {
      cache[host] = {
        requests: {},
        count: 0,
      }
    }

    // Remove empty trailing `?`s
    const safeKey = key.replace(/(\?$)/, "")
    cache[host].requests[safeKey] = metadata
    cache[host].count = cache[host].requests.length
  }
}

// This will only be triggered in non-production environments
export const fetchLoggerSetup = requestID => {
  requests[requestID] = {}
}

// Called at the end of a request, returns the results and resets
export const fetchLoggerRequestDone = requestID => () => {
  const requestCopy = requests[requestID]
  delete requests[requestID]

  return {
    requests: requestCopy,
    requestID,
  }
}

export default logger
