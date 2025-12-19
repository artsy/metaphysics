import {
  GraphQLInt,
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
import { isUndefined, omitBy } from "lodash"

const SuccessType = new GraphQLObjectType<any, ResolverContext>({
  name: "UpdateNavigationItemSuccess",
  isTypeOf: (data) => data.id,
  fields: () => ({
    navigationItem: {
      type: NavigationItemType,
      resolve: (result) => result,
    },
  }),
})

const ErrorType = new GraphQLObjectType<any, ResolverContext>({
  name: "UpdateNavigationItemFailure",
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
  name: "UpdateNavigationItemResponseOrError",
  types: [SuccessType, ErrorType],
})

export const updateNavigationItemMutation = mutationWithClientMutationId<
  any,
  any,
  ResolverContext
>({
  name: "UpdateNavigationItem",
  inputFields: {
    id: {
      type: new GraphQLNonNull(GraphQLString),
      description: "The ID of the navigation item",
    },
    title: {
      type: GraphQLString,
      description: "The title of the navigation item",
    },
    href: {
      type: GraphQLString,
      description: "A relative URL that starts with /",
    },
    parent_id: {
      type: GraphQLString,
      description: "The ID of the parent navigation item",
    },
    position: {
      type: GraphQLInt,
      description: "The position of the navigation item",
    },
  },
  outputFields: {
    navigationItemOrError: {
      type: NavigationItemOrErrorType,
      resolve: (result) => result,
    },
  },
  mutateAndGetPayload: async (args, { updateNavigationItemLoader }) => {
    if (!updateNavigationItemLoader) {
      throw new Error("You need to be signed in to perform this action")
    }

    const gravityArgs = omitBy(
      {
        title: args.title,
        href: args.href,
        parent_id: args.parent_id,
        position: args.position,
      },
      isUndefined
    )

    try {
      const response = await updateNavigationItemLoader(args.id, {
        ...gravityArgs,
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
