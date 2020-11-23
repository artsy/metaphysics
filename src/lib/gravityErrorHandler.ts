import { GraphQLString, GraphQLObjectType } from "graphql"
import { isArray, omit, pickBy } from "lodash"
import { UpdateMyProfileMutationFieldErrorType } from "schema/v2/me/update_me_mutation"
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
      type: GraphQLString,
    },
    detail: {
      type: GraphQLString,
    },
    error: {
      type: GraphQLString,
    },
    fieldErrors: {
      // FIXME: Currently only one use case, but should be union type
      type: UpdateMyProfileMutationFieldErrorType,
    },
  }),
})

export const formatGravityError = (error) => {
  const errorSplit = error.message?.split(" - ")

  if (errorSplit && errorSplit.length > 1) {
    try {
      const parsedError = JSON.parse(errorSplit[1])
      const { error, detail, text } = parsedError

      if (detail) {
        // Parse form errors, an object with array of errors keyed by field
        const hasFieldErrors = pickBy(detail, isArray)
        if (hasFieldErrors) {
          return {
            fieldErrors: detail,
            ...omit(parsedError, "detail"),
          }
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
