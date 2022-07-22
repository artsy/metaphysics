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
import { date } from "../fields/date"
import { IdentityVerificationType } from "../identityVerification"

const IdentityVerificationEmailType = new GraphQLObjectType<
  any,
  ResolverContext
>({
  name: "IdentityVerificationEmail",
  fields: () => ({
    ...InternalIDFields,
    created_at: date(({ created_at }) => created_at),
    email: {
      description: "Email of the identity verification's owner",
      type: GraphQLString,
      resolve: ({ email }) => email,
    },
    name: {
      description: "Name of the identity verification's owner",
      type: GraphQLString,
      resolve: ({ name }) => name,
    },
    state: {
      type: new GraphQLNonNull(GraphQLString),
      description: "Identity verification lifecycle state",
    },
    updated_at: date(({ updated_at }) => updated_at),
    userID: {
      description: "User ID of the identity verification's owner",
      type: GraphQLString,
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
      deprecationReason: "use identityVerification instead",
      resolve: (identityVerification) => identityVerification,
    },
    identityVerification: {
      type: IdentityVerificationType,
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
      description: "The user Id for the user undergoing identity verification",
      type: GraphQLString,
    },
    email: {
      description: "The email for the user undergoing identity verification",
      type: GraphQLString,
    },
    name: {
      description:
        "The name to be used for the user undergoing identity verification",
      type: GraphQLString,
    },
  },
  outputFields: {
    confirmationOrError: {
      type: IdentityVerificationEmailMutationType,
      resolve: (result) => result,
    },
  },
  mutateAndGetPayload: async (
    { userID, email, name },
    { sendIdentityVerificationEmailLoader }
  ) => {
    if (!sendIdentityVerificationEmailLoader) {
      throw new Error("You need to be signed in to perform this action")
    }

    try {
      const response = await sendIdentityVerificationEmailLoader({
        user_id: userID,
        email,
        name,
      })

      return response
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
