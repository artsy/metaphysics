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
import {
  generateBeacon,
  generateUuid,
  getUser,
  getUserQuery,
  hasExistingCrossReference,
} from "lib/infiniteDiscovery/weaviate"

export const ReferenceTypesEnum = new GraphQLEnumType({
  name: "ReferenceTypes",
  values: {
    LIKED_ARTWORKS: {
      value: "likedArtworks",
    },
    SEEN_ARTWORKS: {
      value: "seenArtworks",
      description:
        'Artworks that the user has seen and not "liked". Should not be considered a negative signal.',
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
    { weaviateCreateCrossReferenceLoader, weaviateGraphqlLoader }
  ) => {
    if (!weaviateCreateCrossReferenceLoader || !weaviateGraphqlLoader) {
      new Error("Weaviate loader not available")
    }

    // Fetch the user from Weaviate
    const userQueryResponse = await weaviateGraphqlLoader({
      query: getUserQuery(userId),
    })()

    const user = getUser(userQueryResponse)

    if (!user) {
      throw new Error("Weaviate user not found")
    }

    // Check if the user already has an existing cross reference for the artwork
    if (hasExistingCrossReference(user, artworkId)) {
      return { success: true }
    }

    const artworkUUID = generateUuid(artworkId)
    const artworkBeacon = generateBeacon(
      "InfiniteDiscoveryArtworks",
      artworkUUID
    )

    const userUUID = generateUuid(userId)
    const referenceURL = `${userUUID}/references/${reference}`

    try {
      await weaviateCreateCrossReferenceLoader(referenceURL, {
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
