import {
  GraphQLErrorType,
  GraphQLErrorInterfaceType,
  GraphQLBaseErrorInterfaceType,
} from "lib/precariousField"
import { GraphQLString, GraphQLInt, GraphQLNonNull } from "graphql"

export const ErrorInterfaceType = new GraphQLBaseErrorInterfaceType({
  name: "Error",
  fields: {
    message: {
      type: new GraphQLNonNull(GraphQLString),
    },
  },
})

const HTTPErrorInterfaceType = new GraphQLErrorInterfaceType({
  name: "HTTPError",
  extendsInterface: ErrorInterfaceType,
  fields: {
    statusCode: {
      type: new GraphQLNonNull(GraphQLInt),
    },
  },
})

export class HTTPError extends Error {
  public readonly statusCode: number
  public readonly body?: string

  constructor(message: string, statusCode: number, body?: string) {
    super(message)
    this.statusCode = statusCode
    this.body = body
    Error.captureStackTrace(this, this.constructor)
  }
}

export const HTTPErrorType = new GraphQLErrorType({
  name: "HTTPErrorType",
  errorClass: HTTPError,
  errorInterface: HTTPErrorInterfaceType,
  toErrorData: error => ({
    message: error.message,
    statusCode: error.statusCode,
  }),
  fields: {
    message: {
      type: new GraphQLNonNull(GraphQLString),
    },
    statusCode: {
      type: new GraphQLNonNull(GraphQLInt),
    },
  },
})
