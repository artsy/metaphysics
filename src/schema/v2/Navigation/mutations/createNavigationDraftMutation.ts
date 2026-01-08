import {
  GraphQLNonNull,
  GraphQLObjectType,
  GraphQLString,
  GraphQLUnionType,
} from "graphql"
import { mutationWithClientMutationId } from "graphql-relay"
import { ResolverContext } from "types/graphql"
import { NavigationVersionType } from "../NavigationVersion"
import {
  formatGravityError,
  GravityMutationErrorType,
} from "lib/gravityErrorHandler"
import { isUndefined, omitBy } from "lodash"

const SuccessType = new GraphQLObjectType<any, ResolverContext>({
  name: "CreateNavigationDraftSuccess",
  isTypeOf: (data) => data.id,
  fields: () => ({
    navigationVersion: {
      type: new GraphQLNonNull(NavigationVersionType),
      resolve: (result) => result,
    },
  }),
})

const ErrorType = new GraphQLObjectType<any, ResolverContext>({
  name: "CreateNavigationDraftFailure",
  isTypeOf: (data) => {
    return data._type === "GravityMutationError"
  },
  fields: () => ({
    mutationError: {
      type: new GraphQLNonNull(GravityMutationErrorType),
      resolve: (err) => err,
    },
  }),
})

const NavigationVersionOrErrorType = new GraphQLUnionType({
  name: "CreateNavigationDraftResponseOrError",
  types: [SuccessType, ErrorType],
})

export const createNavigationDraftMutation = mutationWithClientMutationId<
  any,
  any,
  ResolverContext
>({
  name: "CreateNavigationDraft",
  inputFields: {
    groupID: {
      type: new GraphQLNonNull(GraphQLString),
      description: "The ID of the navigation group",
    },
    seedFromVersionID: {
      type: GraphQLString,
      description: "The ID of the navigation version version to seed from",
    },
  },
  outputFields: {
    navigationVersionOrError: {
      type: new GraphQLNonNull(NavigationVersionOrErrorType),
      resolve: (result) => result,
    },
  },
  mutateAndGetPayload: async (args, { createNavigationDraftLoader }) => {
    if (!createNavigationDraftLoader) {
      throw new Error("You need to be signed in to perform this action")
    }

    const gravityArgs = omitBy(
      {
        seed_from_version_id: args.seedFromVersionID,
      },
      isUndefined
    )

    try {
      const response = await createNavigationDraftLoader(args.groupID, {
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
