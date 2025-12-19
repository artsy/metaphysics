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
import { isUndefined, omitBy } from "lodash"

const SuccessType = new GraphQLObjectType<any, ResolverContext>({
  name: "CreateNavigationItemSuccess",
  isTypeOf: (data) => data.id,
  fields: () => ({
    navigationItem: {
      type: NavigationItemType,
      resolve: (result) => result,
    },
  }),
})

const ErrorType = new GraphQLObjectType<any, ResolverContext>({
  name: "CreateNavigationItemFailure",
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
  name: "CreateNavigationItemResponseOrError",
  types: [SuccessType, ErrorType],
})

export const createNavigationItemMutation = mutationWithClientMutationId<
  any,
  any,
  ResolverContext
>({
  name: "CreateNavigationItem",
  inputFields: {
    versionID: {
      type: new GraphQLNonNull(GraphQLString),
      description: "The ID of the navigation version",
    },
    title: {
      type: new GraphQLNonNull(GraphQLString),
      description: "The title of the navigation item",
    },
    href: {
      type: GraphQLString,
      description: "A relative URL that starts with /",
    },
    parentID: {
      type: GraphQLString,
      description: "The ID of the parent navigation item",
    },
  },
  outputFields: {
    navigationItemOrError: {
      type: NavigationItemOrErrorType,
      resolve: (result) => result,
    },
  },
  mutateAndGetPayload: async (args, { createNavigationItemLoader }) => {
    if (!createNavigationItemLoader) {
      throw new Error("You need to be signed in to perform this action")
    }

    const gravityArgs = omitBy(
      {
        navigation_version_id: args.versionID,
        title: args.title,
        href: args.href,
        parent_id: args.parentID,
      },
      isUndefined
    )

    try {
      const response = await createNavigationItemLoader({
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
