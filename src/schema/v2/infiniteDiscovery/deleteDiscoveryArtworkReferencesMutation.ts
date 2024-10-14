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
import gql from "lib/gql"
import { generateBeacon } from "./discoverArtworks"

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
  mutateAndGetPayload: async (
    { userId },
    { weaviateGraphqlLoader, weaviateDeleteObjectLoader }
  ) => {
    if (!weaviateGraphqlLoader || !weaviateDeleteObjectLoader) {
      new Error("Weaviate loader not available")
    }

    const query = gql`
      {
        Get {
          InfiniteDiscoveryUsers(
            where: { path: ["internalID"], operator: Equal, valueString: "${userId}" }
          ) {
            _additional {
              id
            }
            likedArtworks {
              ... on InfiniteDiscoveryArtworks {
                _additional {
                  id
                }
              }
            }
            dislikedArtworks {
              ... on InfiniteDiscoveryArtworks {
                _additional {
                  id
                }
              }
            }
          }
        }
      }
    `
    try {
      const body = await weaviateGraphqlLoader({ query })()
      const users = body.data.Get.InfiniteDiscoveryUsers

      if (!users.length) {
        return { success: true }
      }

      const {
        _additional: { id: uuid },
        likedArtworks,
        dislikedArtworks,
      } = users[0]

      const references = [
        ...getArtworkReferences({
          data: likedArtworks,
          reference: "likedArtworks",
          uuid,
        }),
        ...getArtworkReferences({
          data: dislikedArtworks,
          reference: "dislikedArtworks",
          uuid,
        }),
      ]

      await Promise.all(
        references.map((ref) =>
          weaviateDeleteObjectLoader(ref.url, { beacon: ref.beacon })
        )
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

const getArtworkReferences = ({ data, reference, uuid }) =>
  // remove duplicates if any, because reference duplicating is possible in Weaviate
  Array.from(new Set(data.map((artwork) => artwork._additional.id))).map(
    (id) => {
      const artwork = data.find((artwork) => artwork._additional.id === id)
      return {
        url: `/objects/${uuid}/references/${reference}`,
        beacon: generateBeacon(
          "InfiniteDiscoveryArtworks",
          artwork._additional.id
        ),
      }
    }
  )
