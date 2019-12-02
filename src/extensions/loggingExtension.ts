import { GraphQLExtension, GraphQLResponse } from "graphql-extensions"
import {
  fetchLoggerSetup,
  fetchLoggerRequestDone,
} from "../lib/loaders/api/extensionsLogger"
import { mergeWith, isArray } from "lodash"

function appendArrays(objValue, srcValue) {
  if (isArray(objValue)) {
    return objValue.concat(srcValue)
  }
}

const merge = (...vals) => mergeWith({}, ...vals, appendArrays)

export class LoggingExtension implements GraphQLExtension {
  private enableRequestLogging: boolean
  private requestID: any

  constructor(enableRequestLogging = false) {
    this.enableRequestLogging = enableRequestLogging
  }

  requestDidStart({ context }) {
    try {
      this.requestID = context.requestIDs.requestID
    } catch (error) {
      this.enableRequestLogging = false
      console.error("Could not enable logging.", error)
    }
    if (this.enableRequestLogging) {
      fetchLoggerSetup(this.requestID)
    }
  }

  willSendResponse(options: {
    graphqlResponse: GraphQLResponse
    context: any
  }) {
    if (!this.enableRequestLogging) return options

    if (!options.graphqlResponse.extensions) {
      options.graphqlResponse.extensions = {}
    }

    return merge(options, {
      graphqlResponse: {
        extensions: {
          ...fetchLoggerRequestDone(this.requestID),
        },
      },
    })
  }
}
