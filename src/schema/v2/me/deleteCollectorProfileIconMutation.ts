import { mutationWithClientMutationId } from "graphql-relay"
import { ResolverContext } from "types/graphql"
import {
  formatGravityError,
  GravityMutationErrorType,
} from "lib/gravityErrorHandler"
import Image from "../image"
import { GraphQLBoolean, GraphQLObjectType, GraphQLUnionType } from "graphql"

const UserIconDeleteSuccessType = new GraphQLObjectType<any, ResolverContext>({
  name: "UserIconDeleteSuccessType",
  isTypeOf: (data) => {
    return data.id
  },
  fields: () => ({
    success: {
      type: GraphQLBoolean,
      resolve: () => true,
    },
    icon: {
      type: Image.type,
      resolve: (icon) => icon,
    },
  }),
})

const UserIconDeleteFailureType = new GraphQLObjectType<any, ResolverContext>({
  name: "UserIconDeleteFailureType",
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

export const UserIconDeletionMutationType = new GraphQLUnionType({
  name: "UserIconDeletionMutationType",
  types: [UserIconDeleteSuccessType, UserIconDeleteFailureType],
})

export const deleteCollectorProfileIconMutation = mutationWithClientMutationId<
  any,
  any,
  ResolverContext
>({
  name: "DeleteUserIcon",
  description: "Remove the user icon",
  inputFields: {},
  outputFields: {
    iconOrError: {
      type: UserIconDeletionMutationType,
      resolve: (result) => result,
    },
  },
  mutateAndGetPayload: (_, { deleteCollectorProfileIconLoader }) => {
    if (!deleteCollectorProfileIconLoader) {
      return new Error("You need to be signed in to perform this action")
    }
    return deleteCollectorProfileIconLoader()
      .then((response) => response)
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
