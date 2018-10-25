import {
  GraphQLErrorType,
  GraphQLErrorInterfaceType,
  GraphQLBaseErrorInterfaceType,
} from "lib/precariousField"
import { GraphQLString, GraphQLInt } from "graphql"

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
