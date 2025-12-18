import {
  GraphQLNonNull,
  GraphQLObjectType,
  GraphQLString,
  GraphQLUnionType,
} from "graphql"
import { mutationWithClientMutationId } from "graphql-relay"
import { ResolverContext } from "types/graphql"
import { NavigationItemType } from "../NavigationItem"
import {
  formatGravityError,
  GravityMutationErrorType,
} from "lib/gravityErrorHandler"

const SuccessType = new GraphQLObjectType<any, ResolverContext>({
  name: "DeleteNavigationItemSuccess",
  isTypeOf: (data) => data.id,
  fields: () => ({
    navigationItem: {
      type: NavigationItemType,
      resolve: (result) => result,
    },
  }),
})

const ErrorType = new GraphQLObjectType<any, ResolverContext>({
  name: "DeleteNavigationItemFailure",
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

const NavigationItemOrErrorType = new GraphQLUnionType({
  name: "DeleteNavigationItemResponseOrError",
  types: [SuccessType, ErrorType],
})

export const deleteNavigationItemMutation = mutationWithClientMutationId<
  any,
  any,
  ResolverContext
>({
  name: "DeleteNavigationItem",
  inputFields: {
    id: {
      type: new GraphQLNonNull(GraphQLString),
      description: "The ID of the navigation item",
    },
  },
  outputFields: {
    navigationItemOrError: {
      type: NavigationItemOrErrorType,
      resolve: (result) => result,
    },
  },
  mutateAndGetPayload: async (args, { deleteNavigationItemLoader }) => {
    if (!deleteNavigationItemLoader) {
      throw new Error("You need to be signed in to perform this action")
    }

    try {
      const response = await deleteNavigationItemLoader(args.id)
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
