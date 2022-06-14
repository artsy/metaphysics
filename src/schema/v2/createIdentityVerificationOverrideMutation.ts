import { GraphQLObjectType, GraphQLString, GraphQLUnionType } from "graphql"
import { ResolverContext } from "types/graphql"
import {
  formatGravityError,
  GravityMutationErrorType,
} from "lib/gravityErrorHandler"
import { IdentityVerificationOverrideType } from "./identityVerification"
import { mutationWithClientMutationId } from "graphql-relay"

const CreateIdentityVerificationOverrideMutationFailureType = new GraphQLObjectType<
  any,
  ResolverContext
>({
  name: "CreateIdentityVerificationMutationFailure",
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

const CreateIdentityVerificationOverrideMutationSuccessType = new GraphQLObjectType<
  any,
  ResolverContext
>({
  name: "CreateIdentityVerificationMutationSuccess",
  isTypeOf: (data) => data.id,
  fields: () => ({
    identityVerificationOverride: {
      type: IdentityVerificationOverrideType,
      resolve: (identityVerificationOverride) => identityVerificationOverride,
    },
  }),
})

export const CreateIdentityVerificationOverrideMutationType = new GraphQLUnionType(
  {
    name: "CreateIdentityVerificationOverrideMutationType",
    types: [
      CreateIdentityVerificationOverrideMutationSuccessType,
      CreateIdentityVerificationOverrideMutationFailureType,
    ],
  }
)

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
      type: GraphQLString,
    },
    state: {
      description: "The state of the identity verification override",
      type: GraphQLString,
    },
    reason: {
      description: "The reason for the identity verification override",
      type: GraphQLString,
    },
  },
  outputFields: {
    confirmationOrError: {
      type: CreateIdentityVerificationOverrideMutationType,
      resolve: (result) => result,
    },
  },
  mutateAndGetPayload: async (
    { identityVerificationID, state, reason },
    { createIdentityVerificationOverrideLoader }
  ) => {
    if (!createIdentityVerificationOverrideLoader) {
      throw new Error("You need to be signed in to perform this action")
    }

    return createIdentityVerificationOverrideLoader(identityVerificationID, {
      state,
      reason,
    })
      .then((result) => result)
      .catch((error) => {
        const formattedErr = formatGravityError(error)
        if (formattedErr) {
          return { ...formattedErr, _type: "GravityMutationError" }
        } else {
          throw new Error(error)
        }
      })
  },
})
