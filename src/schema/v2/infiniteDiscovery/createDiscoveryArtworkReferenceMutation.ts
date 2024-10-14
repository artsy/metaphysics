import {
  GraphQLBoolean,
  GraphQLNonNull,
  GraphQLObjectType,
  GraphQLString,
  GraphQLUnionType,
  GraphQLEnumType,
} from "graphql"
import { ResolverContext } from "types/graphql"
import {
  formatGravityError,
  GravityMutationErrorType,
} from "lib/gravityErrorHandler"
import { mutationWithClientMutationId } from "graphql-relay"
import { generateUuid, generateBeacon } from "./discoverArtworks"

export const ReferenceTypesEnum = new GraphQLEnumType({
  name: "ReferenceTypes",
  values: {
    LIKED_ARTWORKS: {
      value: "likedArtworks",
    },
    DISLIKED_ARTWORKS: {
      value: "dislikedArtworks",
    },
  },
})

const SuccessType = new GraphQLObjectType<any, ResolverContext>({
  name: "DiscoveryArtworkReferenceMutationSuccess",
  isTypeOf: (data) => data.success,
  fields: () => ({
    success: {
      type: GraphQLBoolean,
      resolve: (result) => result.success,
    },
  }),
})

const FailureType = new GraphQLObjectType<any, ResolverContext>({
  name: "DiscoveryArtworkReferenceMutationFailure",
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
  name: "CreateDiscoveryArtworkReferenceResponseOrError",
  types: [SuccessType, FailureType],
})

export const CreateDiscoveryLikedArtworkMutation = mutationWithClientMutationId<
  { userId: string; artworkId: string; reference: string },
  any,
  ResolverContext
>({
  name: "CreateDiscoveryArtworkReferenceMutation",
  description: "Creates a cross reference for artwork and user in weaviate",
  inputFields: {
    userId: {
      description: "The user's ID",
      type: GraphQLString,
    },
    artworkId: {
      description: "The artwork's ID",
      type: new GraphQLNonNull(GraphQLString),
    },
    reference: {
      description: "The reference type",
      type: new GraphQLNonNull(ReferenceTypesEnum),
    },
  },
  outputFields: {
    createDiscoveryArtworkReferenceResponseOrError: {
      type: ResponseOrErrorType,
      description: "On success: return boolean. On failure: MutationError.",
      resolve: (result) => result,
    },
  },
  mutateAndGetPayload: async (
    { userId, artworkId, reference },
    { weaviateCreateObjectLoader }
  ) => {
    if (!weaviateCreateObjectLoader) {
      new Error("Weaviate loader not available")
    }

    const artworkUUID = generateUuid(artworkId)
    const artworkBeacon = generateBeacon(
      "InfiniteDiscoveryArtworks",
      artworkUUID
    )

    const userUUID = generateUuid(userId)
    const referenceURL = `InfiniteDiscoveryUsers/${userUUID}/references/${reference}`

    try {
      await weaviateCreateObjectLoader(referenceURL, {
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
