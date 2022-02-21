import {
  GraphQLNonNull,
  GraphQLObjectType,
  GraphQLString,
  GraphQLUnionType,
} from "graphql"
import { mutationWithClientMutationId } from "graphql-relay"
import { ResolverContext } from "types/graphql"
import {
  GravityMutationErrorType,
  formatGravityError,
} from "lib/gravityErrorHandler"
import { InternalIDFields } from "../object_identification"

const IdentityVerificationEmailType = new GraphQLObjectType<
  any,
  ResolverContext
>({
  name: "IdentityVerificationEmail",
  fields: () => ({
    ...InternalIDFields,
    state: {
      type: new GraphQLNonNull(GraphQLString),
      description: "Identity verification lifecycle state",
    },
    userID: {
      description: "User ID of the identity verification's owner",
      type: new GraphQLNonNull(GraphQLString),
      resolve: ({ user_id }) => user_id,
    },
  }),
})

const IdentityVerificationEmailMutationSuccessType = new GraphQLObjectType<
  any,
  ResolverContext
>({
  name: "IdentityVerificationEmailMutationSuccessType",
  isTypeOf: (data) => data.id,
  fields: () => ({
    identityVerificationEmail: {
      type: IdentityVerificationEmailType,
      resolve: (identityVerification) => identityVerification,
    },
  }),
})

const IdentityVerificationEmailMutationFailureType = new GraphQLObjectType<
  any,
  ResolverContext
>({
  name: "IdentityVerificationEmailMutationFailureType",
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

const IdentityVerificationEmailMutationType = new GraphQLUnionType({
  name: "IdentityVerificationEmailMutationType",
  types: [
    IdentityVerificationEmailMutationSuccessType,
    IdentityVerificationEmailMutationFailureType,
  ],
})

export const sendIdentityVerificationEmailMutation = mutationWithClientMutationId<
  any,
  any,
  ResolverContext
>({
  name: "SendIdentityVerificationEmailMutation",
  description: "Send a identity verification email",
  inputFields: {
    userID: {
      type: GraphQLString,
    },
  },
  outputFields: {
    confirmationOrError: {
      type: IdentityVerificationEmailMutationType,
      resolve: (result) => result,
    },
  },
  mutateAndGetPayload: (
    { userID },
    { sendIdentityVerificationEmailLoader }
  ) => {
    if (!sendIdentityVerificationEmailLoader) {
      throw new Error("You need to be signed in to perform this action")
    }

    return sendIdentityVerificationEmailLoader(userID)
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
