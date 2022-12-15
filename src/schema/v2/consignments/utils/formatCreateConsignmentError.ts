import {
  GraphQLInt,
  GraphQLNonNull,
  GraphQLObjectType,
  GraphQLString,
} from "graphql"
import { ResolverContext } from "types/graphql"

export const ConsignmentInquiryMutationErrorName =
  "ConsignmentInquiryMutationError"

export const ConsignmentInquiryErrorType = new GraphQLObjectType<
  any,
  ResolverContext
>({
  name: ConsignmentInquiryMutationErrorName,
  fields: () => ({
    type: {
      type: GraphQLString,
    },
    message: {
      type: new GraphQLNonNull(GraphQLString),
    },
    error: {
      type: GraphQLString,
    },
    statusCode: {
      type: GraphQLInt,
    },
  }),
})

export const formatCreateConsignmentError = (error) => {
  if (typeof error === "string") {
    return {
      error,
      message: error,
    }
  }

  let err
  if (error instanceof Error) {
    err = JSON.parse(error.message)
    const message = err?.error || err?.message || ""
    return {
      error: message.length ? message : error.message,
      message,
      statusCode: err?.statusCode,
      type: "error",
    }
  }
  return { ...err }
}
