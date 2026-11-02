import {
  GraphQLFieldConfig,
  GraphQLObjectType,
  GraphQLOutputType,
  GraphQLUnionType,
} from "graphql"
import {
  formatGravityError,
  GravityMutationErrorType,
} from "lib/gravityErrorHandler"
import { ResolverContext } from "types/graphql"

/**
 * Builds the `<Name>Success | <Name>Failure` union that CRM contact mutations
 * return, where the success type exposes the Gravity record as `payloadField`.
 */
export const responseOrErrorType = ({
  name,
  payloadField,
  payloadType,
}: {
  name: string
  payloadField: string
  payloadType: GraphQLOutputType
}) => {
  const SuccessType = new GraphQLObjectType<any, ResolverContext>({
    name: `${name}Success`,
    isTypeOf: (data) => data._type !== "GravityMutationError",
    fields: () => ({
      [payloadField]: {
        type: payloadType,
        resolve: (result) => result,
      } as GraphQLFieldConfig<any, ResolverContext>,
    }),
  })

  const FailureType = new GraphQLObjectType<any, ResolverContext>({
    name: `${name}Failure`,
    isTypeOf: (data) => data._type === "GravityMutationError",
    fields: () => ({
      mutationError: {
        type: GravityMutationErrorType,
        resolve: (err) => err,
      },
    }),
  })

  return new GraphQLUnionType({
    name: `${name}ResponseOrError`,
    types: [SuccessType, FailureType],
    resolveType: (data) =>
      data._type === "GravityMutationError"
        ? `${name}Failure`
        : `${name}Success`,
  })
}

/**
 * Runs a Gravity call, turning an HTTP error (400 validation, 404, 409 primary
 * conflict, ...) into a `GravityMutationError` for the failure type.
 */
export const withGravityMutationError = async (call: () => Promise<any>) => {
  try {
    return await call()
  } catch (error) {
    const formattedErr = formatGravityError(error)
    if (formattedErr) {
      return { ...formattedErr, _type: "GravityMutationError" }
    } else {
      throw new Error(error)
    }
  }
}

export const NOT_SIGNED_IN = "You need to be signed in to perform this action"
