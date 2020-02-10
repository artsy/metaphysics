import { mutationWithClientMutationId } from "graphql-relay"
import { ResolverContext } from "types/graphql"
import {
  GraphQLInputObjectType,
  GraphQLString,
  GraphQLUnionType,
  GraphQLObjectType,
} from "graphql"
import { GravityMutationErrorType } from "lib/gravityErrorHandler"

const InputType = new GraphQLInputObjectType({
  name: "StartIdentityVerificationInput",
  fields: {
    identityVerificationId: {
      type: GraphQLString,
      description: "Primary ID of the identity verification to be started",
    },
  },
})

const FailureType = new GraphQLObjectType<any, ResolverContext>({
  name: "startIdentityVerificationFailure",
  isTypeOf: data => {
    return data._type === "GravityMutationError"
  },
  fields: () => ({
    mutationError: {
      type: GravityMutationErrorType,
      resolve: err => err,
    },
  }),
})

const SuccessType = new GraphQLObjectType<any, ResolverContext>({
  name: "startIdentityVerificationSuccess",
  isTypeOf: data => data.identityVerificationId,
  fields: () => ({
    identityVerificationId: {
      type: GraphQLString,
      description: "Primary ID of the started identity verification",
    },
    identityVerificationWizardUrl: {
      type: GraphQLString,
      description:
        "URL that hosts the user-facing identity verification wizard",
    },
  }),
})

const OutputType = new GraphQLUnionType({
  name: "startIdentityVerificationResponseOrError",
  types: [SuccessType, FailureType],
})

export const startIdentityVerificationMutation = mutationWithClientMutationId<
  any,
  any,
  ResolverContext
>({
  name: "startIdentityVerificationMutation",
  description: "Start an existing identity verification flow",
  inputFields: InputType.getFields(),
  outputFields: {
    startIdentityVerificationResponseOrError: {
      type: OutputType,
      resolve: result => result,
    },
  },
  mutateAndGetPayload: ({ identityVerificationId }) => {
    return {
      identityVerificationId: identityVerificationId,
    }
  },
})
