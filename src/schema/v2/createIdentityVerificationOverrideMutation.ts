import {
  GraphQLNonNull,
  GraphQLObjectType,
  GraphQLString,
  GraphQLUnionType,
} from "graphql"
import { ResolverContext } from "types/graphql"
import {
  formatGravityError,
  GravityMutationErrorType,
} from "lib/gravityErrorHandler"
import { IdentityVerificationType } from "./identityVerification"
import { mutationWithClientMutationId } from "graphql-relay"

const SuccessType = new GraphQLObjectType<any, ResolverContext>({
  name: "IdentityVerificationOverrideMutationSuccess",
  isTypeOf: (data) => data.id,
  fields: () => ({
    identityVerification: {
      type: IdentityVerificationType,
      resolve: async (
        { identityVerificationID },
        _args,
        { identityVerificationLoader }
      ) => {
        if (!identityVerificationLoader) return
        return identityVerificationLoader(identityVerificationID)
      },
    },
  }),
})

const FailureType = new GraphQLObjectType<any, ResolverContext>({
  name: "IdentityVerificationOverrideMutationFailure",
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
  name: "CreateIdentityVerificationOverrideResponseOrError",
  types: [SuccessType, FailureType],
})

export const createIdentityVerificationOverrideMutation = mutationWithClientMutationId<
  { identityVerificationID: string; state: string; reason: string },
  any,
  ResolverContext
>({
  name: "CreateIdentityVerificationOverrideMutation",
  description: "Create an identity verification override",
  inputFields: {
    identityVerificationID: {
      description: "The identity verification ID",
      type: new GraphQLNonNull(GraphQLString),
    },
    state: {
      description: "The state of the identity verification override",
      type: new GraphQLNonNull(GraphQLString),
    },
    reason: {
      description: "The reason for the identity verification override",
      type: new GraphQLNonNull(GraphQLString),
    },
  },
  outputFields: {
    createIdentityVerificationOverrideResponseOrError: {
      type: ResponseOrErrorType,
      description: "On success: an identity verification with overrides",
      resolve: (result) => result,
    },
  },
  mutateAndGetPayload: async (input, context) => {
    const { identityVerificationID, state, reason } = input
    const { createIdentityVerificationOverrideLoader } = context

    if (!createIdentityVerificationOverrideLoader) {
      throw new Error("You need to be signed in to perform this action")
    }
    try {
      const result = await createIdentityVerificationOverrideLoader(
        identityVerificationID,
        { state, reason }
      )
      return {
        ...result,
        identityVerificationID,
      }
    } catch (error) {
      const formattedErr = formatGravityError(error)
      if (formattedErr) {
        return { ...formattedErr, _type: "GravityMutationError" }
      } else {
        throw new Error(error)
      }
    }
  },
})
