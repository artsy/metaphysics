import {
  GraphQLString,
  GraphQLObjectType,
  GraphQLNonNull,
  GraphQLList,
  GraphQLInt,
} from "graphql"
import { isObject } from "lodash"
import { ResolverContext } from "types/graphql"

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
  const freeBody: any = error.body

  let parsedError
  try {
    parsedError = JSON.parse(freeBody)
  } catch {}

  if (isObject(parsedError)) {
    return {
      type: "error",
      error: freeBody,
      statusCode: error.statusCode,
      message: parsedError.error || parsedError.message,
    }
  } else if (typeof freeBody.error === "string") {
    return {
      type: "error",
      message: freeBody.error,
    }
  } else if (typeof freeBody === "string") {
    return {
      type: "error",
      message: freeBody,
    }
  }

  const fieldErrors = formatGravityErrorDetails(freeBody.detail || {})
  const detail = typeof freeBody?.detail === "object" ? null : freeBody?.detail

  return {
    type: "error",
    statusCode: error.statusCode,
    message: freeBody.message,
    fieldErrors,
    detail,
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
