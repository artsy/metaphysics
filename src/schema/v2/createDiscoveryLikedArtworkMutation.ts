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
import { generateUuid, generateBeacon } from "./discoverArtworks"

const SuccessType = new GraphQLObjectType<any, ResolverContext>({
  name: "DiscoveryLikedArtworkMutationSuccess",
  isTypeOf: (data) => data.success,
  fields: () => ({
    success: {
      type: GraphQLBoolean,
      resolve: (result) => result.success,
    },
  }),
})

const FailureType = new GraphQLObjectType<any, ResolverContext>({
  name: "DiscoveryLikedArtworkMutationFailure",
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
  name: "CreateDiscoveryLikedArtworkResponseOrError",
  types: [SuccessType, FailureType],
})

export const createDiscoveryLikedArtworkMutation = mutationWithClientMutationId<
  { userId: string; artworkId: string },
  any,
  ResolverContext
>({
  name: "CreateDiscoveryLikedArtworkMutation",
  description:
    "Create a liked artwork cross reference for the user in weaviate",
  inputFields: {
    userId: {
      description: "The user's ID",
      type: new GraphQLNonNull(GraphQLString),
    },
    artworkId: {
      description: "The artwork's ID",
      type: new GraphQLNonNull(GraphQLString),
    },
  },
  outputFields: {
    createDiscoveryLikedArtworkResponseOrError: {
      type: ResponseOrErrorType,
      description: "On success: return boolean. On failure: MutationError.",
      resolve: (result) => result,
    },
  },
  mutateAndGetPayload: async (
    { userId, artworkId },
    { weaviateCreateCrossReferenceLoader }
  ) => {
    if (!weaviateCreateCrossReferenceLoader) {
      new Error("Weaviate loader not available")
    }

    const artworkUUID = generateUuid(artworkId)
    const artworkBeacon = generateBeacon(
      "InfiniteDiscoveryArtworks",
      artworkUUID
    )

    const userUUID = generateUuid(userId)

    try {
      await weaviateCreateCrossReferenceLoader(userUUID, {
        beacon: artworkBeacon,
      })
      return { success: true }
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
