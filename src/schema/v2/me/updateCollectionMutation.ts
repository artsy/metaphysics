import {
  GraphQLObjectType,
  GraphQLUnionType,
  GraphQLNonNull,
  GraphQLString,
} from "graphql"
import { mutationWithClientMutationId } from "graphql-relay"
import {
  GravityMutationErrorType,
  formatGravityErrorDetails,
} from "lib/gravityErrorHandler"
import { ResolverContext } from "types/graphql"
import { CollectionType } from "./collection"

const SuccessType = new GraphQLObjectType<any, ResolverContext>({
  name: "UpdateCollectionSuccess",
  isTypeOf: (data) => data.id,
  fields: () => ({
    collection: {
      type: CollectionType,
      resolve: (response) => {
        return response
      },
    },
  }),
})

const ErrorType = new GraphQLObjectType<any, ResolverContext>({
  name: "UpdateCollectionFailure",
  isTypeOf: (data) => {
    return data._type === "GravityMutationError"
  },
  fields: () => ({
    mutationError: {
      type: GravityMutationErrorType,
      resolve: (err) => err,
    },
  }),
})

const ResponseOrErrorType = new GraphQLUnionType({
  name: "UpdateCollectionResponseOrError",
  types: [SuccessType, ErrorType],
})

interface InputProps {
  id: string
  name: string
}

export const updateCollectionMutation = mutationWithClientMutationId<
  InputProps,
  any,
  ResolverContext
>({
  name: "updateCollection",
  description: "Update a collection",
  inputFields: {
    id: {
      description: "The internal ID of the collection",
      type: new GraphQLNonNull(GraphQLString),
    },
    name: { type: new GraphQLNonNull(GraphQLString) },
  },
  outputFields: {
    responseOrError: {
      type: ResponseOrErrorType,
      resolve: (result) => result,
    },
  },
  mutateAndGetPayload: async (args, context) => {
    if (!context.updateCollectionLoader) {
      throw new Error("You need to be signed in to perform this action")
    }

    try {
      const response = await context.updateCollectionLoader(args.id, {
        name: args.name,
        user_id: context.userID,
      })

      return response
    } catch (error) {
      const formattedErr = formatGravityHttpError(error)

      if (formattedErr) {
        return { ...formattedErr, _type: "GravityMutationError" }
      } else {
        throw new Error(error)
      }
    }
  },
})

const formatGravityHttpError = (error) => {
  const errorBody =
    typeof error.body === "string" ? JSON.parse(error.body) : error.body
  const errorType = errorBody?.type || "error"
  const message = errorBody?.message || errorBody?.error
  // confusing part: gravity returns field errors in the body.detail, but in some cases (PaymentError for instance),
  // body.detail includes a string message. GravityMutationErrorType#fieldErrors hold the actual field errors
  // and GravityMutationErrorType#detail - the string message
  const fieldErrors = formatGravityErrorDetails(errorBody?.detail || {})
  const detail =
    typeof errorBody?.detail === "object" ? null : errorBody?.detail

  return {
    type: errorType,
    statusCode: error.statusCode,
    message,
    fieldErrors,
    detail,
  }
}
