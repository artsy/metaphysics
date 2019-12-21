import {
  GraphQLNonNull,
  GraphQLString,
  GraphQLInputObjectType,
  GraphQLObjectType,
  GraphQLUnionType,
} from "graphql"
import { mutationWithClientMutationId } from "graphql-relay"
import { ResolverContext } from "types/graphql"
import {
  GravityMutationErrorType,
  formatGravityError,
} from "lib/gravityErrorHandler"
import { InternalIDFields } from "./object_identification"

const AccountRequestType = new GraphQLObjectType<any, ResolverContext>({
  name: "AccountRequest",
  fields: () => ({
    ...InternalIDFields,
    notes: { type: GraphQLString },
  }),
})

const CreateAccountRequestMutationSuccessType = new GraphQLObjectType<
  any,
  ResolverContext
>({
  name: "CreateAccountRequestMutationSuccess",
  isTypeOf: data => data.id,
  fields: () => ({
    accountRequest: {
      type: AccountRequestType,
      resolve: accountRequest => accountRequest,
    },
  }),
})

const CreateAccountRequestMutationFailureType = new GraphQLObjectType<
  any,
  ResolverContext
>({
  name: "CreateAccountRequestMutationFailure",
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

const CreateAccountRequestMutationType = new GraphQLUnionType({
  name: "CreateAccountRequestMutationType",
  types: [
    CreateAccountRequestMutationSuccessType,
    CreateAccountRequestMutationFailureType,
  ],
})

const CreateAccountRequestInputType = new GraphQLInputObjectType({
  name: "CreateAccountRequestInput",
  fields: {
    notes: {
      type: new GraphQLNonNull(GraphQLString),
      description: "Message to be sent.",
    },
    email: {
      type: GraphQLString,
      description: "Email to associate with message.",
    },
    name: {
      type: GraphQLString,
      description: "Name to associate with message.",
    },
    userID: {
      type: GraphQLString,
      description: "Used when logged in.",
    },
    action: {
      type: GraphQLString,
      description: "Type of account request.",
    },
  },
})

export const createAccountRequestMutation = mutationWithClientMutationId<
  any,
  any,
  ResolverContext
>({
  name: "CreateAccountRequestMutation",
  description: "Create an account request",
  inputFields: CreateAccountRequestInputType.getFields(),
  outputFields: {
    accountRequestOrError: {
      type: CreateAccountRequestMutationType,
      resolve: result => result,
    },
  },
  mutateAndGetPayload: (
    { notes, email, userID, action, name },
    { createAccountRequestLoader }
  ) => {
    const gravityOptions = {
      notes,
      email,
      user_id: userID,
      action,
      name,
    }
    return createAccountRequestLoader(gravityOptions)
      .then(result => result)
      .catch(error => {
        const formattedErr = formatGravityError(error)
        if (formattedErr) {
          return { ...formattedErr, _type: "GravityMutationError" }
        } else {
          throw new Error(error)
        }
      })
  },
})
