import { mutationWithClientMutationId } from "graphql-relay"
import { ResolverContext } from "types/graphql"
import {
  formatGravityError,
  GravityMutationErrorType,
} from "lib/gravityErrorHandler"
import Image from "../image"
import { GraphQLBoolean, GraphQLObjectType, GraphQLUnionType } from "graphql"

const UserIconDeleteSuccess = new GraphQLObjectType<any, ResolverContext>({
  name: "UserIconDeleteSuccess",
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

const UserIconDeleteFailure = new GraphQLObjectType<any, ResolverContext>({
  name: "UserIconDeleteFailure",
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
  types: [UserIconDeleteSuccess, UserIconDeleteFailure],
})

export default mutationWithClientMutationId<any, any, ResolverContext>({
  name: "DeleteUserIcon",
  description: "Remove the user icon",
  inputFields: {},
  outputFields: {
    iconOrError: {
      type: UserIconDeletionMutationType,
    },
  },
  mutateAndGetPayload: ({ deleteMeIconLoader }) => {
    if (!deleteMeIconLoader) {
      return new Error("You need to be signed in to perform this action")
    }
    try {
      return deleteMeIconLoader()
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
