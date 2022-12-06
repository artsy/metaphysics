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
  const errorSplit = error.message?.split(" - ")

  if (error instanceof HTTPError) {
    // gravity returns errors as HTTPErrors but the body is actually
    // a json object and not a string as expected, this checks for both cases
    const freeBody: any = error.body

    let parsedError
    try {
      parsedError = JSON.parse(freeBody)
    } catch {}

    if (isObject(parsedError)) {
      return {
        type: "error",
        error: freeBody,
        statusCode: error?.statusCode,
        message: parsedError.error,
      }
    } else if (freeBody.error as string) {
      return {
        type: "error",
        message: freeBody.error,
      }
    } else if (freeBody as string) {
      return {
        type: "error",
        message: freeBody,
      }
    }
  }

  if (errorSplit && errorSplit.length > 1) {
    try {
      const parsedError = JSON.parse(errorSplit[1])
      const { error, detail, text } = parsedError
      // check if error message format is an array
      // see https://github.com/artsy/gravity/blob/master/app/api/util/error_handlers.rb#L32
      const fieldErrorResults =
        detail && Object.keys(pickBy(detail, isArray))?.length

      if (fieldErrorResults) {
        const fieldErrors = formatGravityErrorDetails(detail)
        return {
          fieldErrors,
          ...omit(parsedError, "detail"),
        }
      }

      if (error) {
        return {
          type: "error",
          message: error,
          detail: text,
        }
      } else {
        return { ...parsedError }
      }
    } catch (e) {
      return { message: errorSplit[1] }
    }
  } else {
    return null
  }
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

const formatGravityErrorDetails = (
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
