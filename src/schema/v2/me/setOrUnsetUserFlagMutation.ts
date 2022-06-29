import {
  GraphQLNonNull,
  GraphQLObjectType,
  GraphQLString,
  GraphQLUnionType,
} from "graphql"
import { mutationWithClientMutationId } from "graphql-relay"
import { GravityMutationErrorType } from "lib/gravityErrorHandler"
import { snakeCase } from "lodash"
import { ResolverContext } from "types/graphql"
import { userFlagsResolver, UserFlagsType } from "./user_flags"

const MutationSuccessType = new GraphQLObjectType<any, ResolverContext>({
  name: "SetOrUnsetUserFlagMutationSuccess",
  isTypeOf: (data) => {
    return data._type !== "GravityMutationError"
  },
  fields: () => ({
    userFlags: {
      type: UserFlagsType,
      resolve: async (root, options, loaders) => {
        return await userFlagsResolver(root, options, loaders)
      },
    },
  }),
})

const MutationFailureType = new GraphQLObjectType<any, ResolverContext>({
  name: "SetOrUnsetUserFlagMutationFailure",
  isTypeOf: (data) => {
    return data._type === "GravityMutationError"
  },
  fields: () => ({
    mutationError: {
      type: GravityMutationErrorType,
      resolve: (err) => (typeof err.message === "object" ? err.message : err),
    },
  }),
})

const SetOrUnsetUserFlagMutationType = new GraphQLUnionType({
  name: "SetOrUnsetUserFlagMutationType",
  types: [MutationSuccessType, MutationFailureType],
})

export const setOrUnsetUserFlagMutation = mutationWithClientMutationId<
  any,
  any,
  ResolverContext
>({
  name: "SetOrUnsetUserFlagMutation",
  description: "Set/unset a flag in the current user's user_flags",
  inputFields: {
    key: {
      type: new GraphQLNonNull(GraphQLString),
      description: "The name of the flag to set or unset",
    },
    value: {
      type: GraphQLString,
      description: "The value to set for a flag. Pass null to unset the flag",
    },
  },
  outputFields: {
    userFlagsOrError: {
      type: SetOrUnsetUserFlagMutationType,
      resolve: (result) => result,
    },
  },
  mutateAndGetPayload: async (args, { setUserFlagLoader }) => {
    if (!setUserFlagLoader) {
      throw new Error("You need to be signed in to perform this action")
    }

    const options = Object.keys(args).reduce((acc, key) => {
      let val = args[key]
      if (key === "key") {
        val = snakeCase(val)
      }
      return { ...acc, [key]: val }
    }, {})

    return setUserFlagLoader(options)
  },
})
