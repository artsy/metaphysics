import { GraphQLExtension, GraphQLResponse } from "graphql-extensions"
import {
  graphqlErrorHandler,
  GraphQLErrorHandler,
} from "../lib/graphqlErrorHandler"
import { Request } from "express"
import { GraphQLError } from "graphql"

interface ErrorExtensionOptions {
  enableSentry?: boolean
  errorHandler?: GraphQLErrorHandler
}

const defaultErrorExtensionOptions: ErrorExtensionOptions = {
  enableSentry: false,
}

export class ErrorExtension implements GraphQLExtension {
  private enableSentry: boolean
  private errorHandler?: GraphQLErrorHandler
  private req?: Request
  private variables?: { [key: string]: any }
  private query?: string

  constructor(options: ErrorExtensionOptions = defaultErrorExtensionOptions) {
    this.enableSentry = !!options.enableSentry
    this.errorHandler = options.errorHandler
  }

  requestDidStart(options) {
    this.req = options.request
    this.query = options.queryString
    this.variables = options.variables
  }

  willSendResponse(options: {
    graphqlResponse: GraphQLResponse
    context: any
  }) {
    if (options.graphqlResponse.errors) {
      if (!this.errorHandler) {
        this.errorHandler = graphqlErrorHandler(this.enableSentry, {
          req: this.req as Request,
          variables: this.variables,
          query: this.query as string,
        })
      }
      options.graphqlResponse.errors = options.graphqlResponse.errors.map(
        (error) => this.errorHandler!(error) as GraphQLError
      )
    }
    return options
  }
}
