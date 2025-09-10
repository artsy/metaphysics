import {
  GraphQLString,
  GraphQLObjectType,
  GraphQLNonNull,
  GraphQLList,
  GraphQLInt,
} from "graphql"
import { isArray, isObject, omit, pickBy } from "lodash"
import { ResolverContext } from "types/graphql"
import { HTTPError } from "./HTTPError"

// Gravity-defined error types: https://github.com/artsy/gravity/blob/main/app/graphql/types/errors_type.rb

const ErrorType = new GraphQLObjectType<any, ResolverContext>({
  name: "Error",
  fields: () => ({
    code: {
      type: new GraphQLNonNull(GraphQLString),
      description: "Error code",
    },
    data: {
      type: GraphQLString, // Defined as JSON in Gravity
      description: "Extra data about error.",
    },
    message: {
      type: new GraphQLNonNull(GraphQLString),
      description: "A description of the error",
    },
    path: {
      type: new GraphQLList(new GraphQLNonNull(GraphQLString)),
      description: "Which input value this error came from",
    },
  }),
})

export const ErrorsType = new GraphQLObjectType<any, ResolverContext>({
  name: "Errors",
  fields: {
    errors: {
      type: new GraphQLList(ErrorType),
    },
  },
})

export const GravityMutationErrorType = new GraphQLObjectType<
  any,
  ResolverContext
>({
  name: "GravityMutationError",
  fields: () => ({
    type: {
      type: GraphQLString,
    },
    message: {
      type: new GraphQLNonNull(GraphQLString),
    },
    detail: {
      type: GraphQLString,
    },
    error: {
      type: GraphQLString,
    },
    fieldErrors: {
      type: GraphQLList(FieldErrorResultsType),
    },
    statusCode: {
      type: GraphQLInt,
    },
  }),
})

export const formatGravityError = (error) => {
  // First try to handle certain error formats.
  // This includes `error.body` being a string,
  // or `error.body.error` being present.
  // In these cases, we return a more minimal object,
  // without more details.
  //
  // TODO: Can we remove this section?
  // TODO: Should Impulse mutations use this method?
  if (error instanceof HTTPError) {
    const freeBody: any = error.body

    let parsedError
    try {
      parsedError = JSON.parse(freeBody)
    } catch {
      console.error("Error parsing Gravity error", freeBody)
    }

    if (isObject(parsedError)) {
      return {
        type: "error",
        error: freeBody,
        statusCode: error.statusCode,
        message: (parsedError as any).error || (parsedError as any).message,
      }
    } else if (freeBody.error) {
      return {
        type: "error",
        message: freeBody.error,
        statusCode: error.statusCode,
      }
    } else if (typeof freeBody === "string") {
      return {
        type: "error",
        message: freeBody,
      }
    }
  }

  if (error.body) {
    try {
      const { error: humanReadableMessage, detail, type } = error.body
      // check if there is a `detail` array, if so format as an object
      // and we can return a richer error object
      const fieldErrorResults =
        detail && Object.keys(pickBy(detail, isArray))?.length

      if (fieldErrorResults) {
        const fieldErrors = formatGravityErrorDetails(detail)
        return {
          fieldErrors,
          ...omit(error.body, "detail"),
          statusCode: error.statusCode,
        }
      }

      // if there is a human readable message, return that
      if (humanReadableMessage) {
        return {
          type: type || "error",
          message: humanReadableMessage,
          ...omit(error.body, "type", "message"),
          statusCode: error.statusCode,
        }
      } else {
        return { ...error.body, statusCode: error.statusCode }
      }
    } catch (e) {
      return { message: error.message, statusCode: error.statusCode }
    }
  }

  // Very legacy error handling (just in specs?)
  const errorSplit = error.message?.split(" - ")
  if (errorSplit && errorSplit.length > 1) {
    try {
      const parsedError = JSON.parse(errorSplit[1])
      const { error } = parsedError

      if (error) {
        return {
          type: "error",
          message: error,
        }
      } else {
        return { ...parsedError }
      }
    } catch (e) {
      return { message: errorSplit[1] }
    }
  }
  return null
}

export const FieldErrorResultsType = new GraphQLObjectType<
  any,
  ResolverContext
>({
  name: "FieldErrorResults",
  fields: () => ({
    name: {
      type: new GraphQLNonNull(GraphQLString),
    },
    message: {
      type: new GraphQLNonNull(GraphQLString),
    },
  }),
})

type FieldErrorType = {
  name: string
  message: string
}

export const formatGravityErrorDetails = (
  detail: Record<string, string[]>
): FieldErrorType[] => {
  const fieldErrors: FieldErrorType[] = []

  Object.keys(detail).forEach((key) => {
    fieldErrors.push({
      name: key,
      message: detail[key].join(", "),
    })
  })
  return fieldErrors
}
