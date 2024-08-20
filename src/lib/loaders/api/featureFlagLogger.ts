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
 * @param featureFlag {string} the type of server
 * @param key {string} basically query string for the call
 * @param metadata {any} any additional details to go along
 */
export const logFeatureFlagCheck = (
  requestID: string,
  featureFlag: string,
  value: boolean
) => {
  if (requests[requestID]) {
    const cache = requests[requestID]

    if (!cache[featureFlag]) {
      cache[featureFlag] = {
        values: [],
        count: 0,
      }
    }
    cache[featureFlag].values.push(value)
    cache[featureFlag].count = cache[featureFlag].values.length
  }
}

// This will only be triggered in non-production environments
export const featureFlagLoggerSetup = (requestID) => {
  requests[requestID] = {}
}

// Called at the end of a request, returns the results and resets
export const featureFlagLoggerRequestDone = (requestID, userAgent) => {
  const featureFlagsResult = requests[requestID]
  delete requests[requestID]
  Object.values(featureFlagsResult).forEach((featureFlag: any) => {
    const { values } = featureFlag
    const valueSet = new Set(values)
    if (valueSet.size > 1) {
      featureFlag.result = "mixed"
    } else {
      featureFlag.result = values[0]
      delete featureFlag.values
    }
  })

  return {
    featureFlags: featureFlagsResult,
    requestID,
    userAgent,
  }
}
