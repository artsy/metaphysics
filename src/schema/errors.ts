import {
  GraphQLErrorType,
  GraphQLErrorInterfaceType,
  GraphQLBaseErrorInterfaceType,
} from "lib/precariousField"
import { GraphQLString, GraphQLInt } from "graphql"

/**
 * The base error interface that all other error interfaces should extend and
 * your error types should implement.
 *
 * Selecting on this interface in your GraphQL documents ensures you’ll always
 * be able to select a `message` field that describes the error in a
 * human-readable form.
 * 
 * @example
 * 
   ```graphql
   query {
     artistOrError {
       ... on Error {
         message
       }
     }
   }
   ```
 */
export const ErrorInterfaceType = new GraphQLBaseErrorInterfaceType({
  name: "Error",
  fields: {
    message: {
      type: GraphQLString,
    },
  },
})

const HTTPErrorInterfaceType = new GraphQLErrorInterfaceType({
  name: "HTTPError",
  extendsInterface: ErrorInterfaceType,
  fields: {
    statusCode: {
      type: GraphQLInt,
    },
  },
})

export class HTTPError extends Error {
  public readonly statusCode: number

  constructor(message: string, statusCode: number) {
    super(message)
    this.statusCode = statusCode
    Error.captureStackTrace(this, this.constructor)
  }
}

export const HTTPErrorType = new GraphQLErrorType({
  errorClass: HTTPError,
  errorInterface: HTTPErrorInterfaceType,
  toErrorData: error => ({
    message: error.message,
    statusCode: error.statusCode,
  }),
  fields: {
    message: {
      type: GraphQLString,
    },
    statusCode: {
      type: GraphQLInt,
    },
  },
})
