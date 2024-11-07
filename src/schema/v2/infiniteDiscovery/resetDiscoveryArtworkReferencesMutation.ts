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
import { generateUuid } from "./discoverArtworks"
import fetch from "node-fetch"

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

export const DeleteDiscoveryUserReferencesMutation = mutationWithClientMutationId<
  { userId: string },
  any,
  ResolverContext
>({
  name: "DeleteDiscoveryUserReferencesMutation",
  description: "Deletes a user artwork references in weaviate",
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
  mutateAndGetPayload: async ({ userId }, {}) => {
    const weaviteUserId = generateUuid(userId)

    // TODO: Temporary implementation to delete likedArtworks and seenArtworks
    // during spike/testing phase. Don't let this code go to production.
    // https://github.com/artsy/metaphysics/pull/6211#discussion_r1832675631
    try {
      await fetch(
        `https://weaviate.stg.artsy.systems/v1/objects/InfiniteDiscoveryUsers/${weaviteUserId}`,
        {
          method: "PATCH",
          headers: {
            "Content-Type": "application/json",
            Accept: "application/json",
          },
          body: JSON.stringify({
            properties: {
              likedArtworks: null,
              seenArtworks: null,
            },
          }),
        }
      )
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
