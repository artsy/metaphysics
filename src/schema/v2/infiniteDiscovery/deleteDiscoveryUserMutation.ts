import {
  GraphQLBoolean,
  GraphQLNonNull,
  GraphQLObjectType,
  GraphQLString,
  GraphQLUnionType,
} from "graphql"
import { ResolverContext } from "types/graphql"
import {
  formatGravityError,
  GravityMutationErrorType,
} from "lib/gravityErrorHandler"
import { mutationWithClientMutationId } from "graphql-relay"
import { generateUuid } from "lib/infiniteDiscovery/weaviate"

const SuccessType = new GraphQLObjectType<any, ResolverContext>({
  name: "DeleteDiscoveryUserReferencesMutationSuccess",
  isTypeOf: (data) => data.success,
  fields: () => ({
    success: {
      type: GraphQLBoolean,
      resolve: (result) => result.success,
    },
  }),
})

const FailureType = new GraphQLObjectType<any, ResolverContext>({
  name: "DeleteDiscoveryUserReferencesMutationFailure",
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

const ResponseOrErrorType = new GraphQLUnionType({
  name: "DeleteDiscoveryUserReferencesResponseOrError",
  types: [SuccessType, FailureType],
})

export const deleteDiscoveryUserMutation = mutationWithClientMutationId<
  { userId: string },
  any,
  ResolverContext
>({
  name: "DeleteDiscoveryUserMutation",
  description: "Deletes a user from the Infinite Discovery system.",
  inputFields: {
    userId: {
      description: "The user's ID",
      type: GraphQLNonNull(GraphQLString),
    },
  },
  outputFields: {
    deleteDiscoveryUserReferencesResponseOrError: {
      type: ResponseOrErrorType,
      description: "On success: return boolean. On failure: MutationError.",
      resolve: (result) => {
        return result
      },
    },
  },
  mutateAndGetPayload: async ({ userId }, { weaviateDeleteUserLoader }) => {
    const weaviateUserId = generateUuid(userId)

    try {
      await weaviateDeleteUserLoader(weaviateUserId)
      return { success: true }
    } catch (error) {
      const formattedErr = formatGravityError(error)
      if (formattedErr) {
        return {
          ...formattedErr,
          _type: "GravityMutationError",
        }
      } else {
        throw new Error(error)
      }
    }
  },
})
