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

const SuccessType = new GraphQLObjectType<any, ResolverContext>({
  name: "PublishNavigationDraftSuccess",
  isTypeOf: (data) => data.id,
  fields: () => ({
    navigationVersion: {
      type: new GraphQLNonNull(NavigationVersionType),
      resolve: (result) => result,
    },
  }),
})

const ErrorType = new GraphQLObjectType<any, ResolverContext>({
  name: "PublishNavigationDraftFailure",
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
  name: "PublishNavigationDraftResponseOrError",
  types: [SuccessType, ErrorType],
})

export const publishNavigationDraftMutation = mutationWithClientMutationId<
  any,
  any,
  ResolverContext
>({
  name: "PublishNavigationDraft",
  description:
    "Publish a draft navigation version. Accepts either a groupID (for backward compatibility) or versionID (preferred for admin workflows).",
  inputFields: {
    groupID: {
      type: GraphQLString,
      description:
        "The ID of the navigation group. Supported for backward compatibility, but versionID is preferred for admin UI workflows.",
    },
    versionID: {
      type: GraphQLString,
      description:
        "The ID of the specific navigation version to publish. Preferred approach for admin UIs.",
    },
  },
  outputFields: {
    navigationVersionOrError: {
      type: new GraphQLNonNull(NavigationVersionOrErrorType),
      resolve: (result) => result,
    },
  },
  mutateAndGetPayload: async (
    args,
    { publishNavigationDraftLoader, publishNavigationVersionLoader }
  ) => {
    if (!publishNavigationDraftLoader || !publishNavigationVersionLoader) {
      throw new Error("You need to be signed in to perform this action")
    }

    // XOR: exactly one of groupID or versionID must be provided
    if (!!args.groupID === !!args.versionID) {
      throw new Error("Provide either groupID or versionID, but not both")
    }

    try {
      // Prefer version-based endpoint if versionID is provided (admin workflows)
      if (args.versionID) {
        const response = await publishNavigationVersionLoader(args.versionID)
        return response
      }

      // Fall back to group-based endpoint (backward compatibility)
      const response = await publishNavigationDraftLoader(args.groupID)
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
