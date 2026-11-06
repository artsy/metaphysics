// Takes info from different dataloaders and combines them to say how many
// requests were made to a system, and how long did each take.
//
// Extends the response for a GraphQL using the official spec's extensions API
// which looks something like:
//
// {
//   "requests": {
//     "gravity": {
//       "requests": {
//         "artwork/steve-mcpherson-metaphorms-novel-mutability-1": {
//           "time": "0s 399.494ms",
//           "cache": false
//         }
//       }
//     }
//   },
//   "requestID": "78e11560-2af2-11e9-bf97-5f29efe19541"
//  }

const requests = {}

/**
 * A logger for calls to external APIs
 *
 * @param requestID {string} the ID for the request
 * @param host {string} the type of server
 * @param key {string} basically query string for the call
 * @param metadata {any} any additional details to go along
 */
const extensionsLogger = (
  requestID: string,
  host: string,
  key: string,
  metadata: any
) => {
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
export const fetchLoggerSetup = (requestID) => {
  requests[requestID] = {}
}

// Called at the end of a request, returns the results and resets
export const fetchLoggerRequestDone = (requestID, userAgent) => {
  const requestCopy = requests[requestID]
  delete requests[requestID]

  return {
    requests: requestCopy,
    requestID,
    userAgent,
  }
}

export default extensionsLogger

export const formatBytes = (bytes: number) => {
  if (bytes < 1024) return bytes + " B"
  else if (bytes < 1048576) return (bytes / 1024).toFixed() + " KB"
  else if (bytes < 1073741824) return (bytes / 1048576).toFixed() + " MB!"
  else return (bytes / 1073741824).toFixed() + " GB!!"
}
