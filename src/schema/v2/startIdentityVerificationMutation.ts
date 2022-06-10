import { mutationWithClientMutationId } from "graphql-relay"
import { ResolverContext } from "types/graphql"
import {
  GraphQLInputObjectType,
  GraphQLString,
  GraphQLUnionType,
  GraphQLObjectType,
  GraphQLNonNull,
} from "graphql"
import {
  GravityMutationErrorType,
  formatGravityError,
} from "lib/gravityErrorHandler"

const InputType = new GraphQLInputObjectType({
  name: "StartIdentityVerificationInput",
  fields: {
    identityVerificationId: {
      type: new GraphQLNonNull(GraphQLString),
      description: "Primary ID of the identity verification to be started",
    },
  },
})

const FailureType = new GraphQLObjectType<any, ResolverContext>({
  name: "StartIdentityVerificationFailure",
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

const SuccessType = new GraphQLObjectType<any, ResolverContext>({
  name: "StartIdentityVerificationSuccess",
  isTypeOf: (data) => data.identity_verification_id,
  fields: () => ({
    identityVerificationId: {
      type: GraphQLString,
      description: "Primary ID of the started identity verification",
      resolve: (res) => res.identity_verification_id,
    },
    identityVerificationFlowUrl: {
      type: GraphQLString,
      description:
        "URL that hosts the user-facing identity verification flow (Jumio)",
      resolve: (res) => res.identity_verification_flow_url,
    },
  }),
})

const OutputType = new GraphQLUnionType({
  name: "StartIdentityVerificationResponseOrError",
  types: [SuccessType, FailureType],
})

export const startIdentityVerificationMutation = mutationWithClientMutationId<
  any,
  any,
  ResolverContext
>({
  name: "startIdentityVerificationMutation",
  description:
    "Start an identity verification flow for a pending identity verification",
  inputFields: InputType.getFields(),
  outputFields: {
    startIdentityVerificationResponseOrError: {
      type: OutputType,
      resolve: (result) => result,
    },
  },
  mutateAndGetPayload: (
    { identityVerificationId },
    { startIdentityVerificationLoader }
  ) => {
    return startIdentityVerificationLoader(identityVerificationId).catch(
      (error) => {
        const formattedErr = formatGravityError(error)
        if (formattedErr) {
          return { ...formattedErr, _type: "GravityMutationError" }
        } else {
          throw new Error(error)
        }
      }
    )
  },
})
