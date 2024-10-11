import { GraphQLString, GraphQLFieldConfig, GraphQLInt } from "graphql"
import { ResolverContext } from "types/graphql"
import { artworkConnection } from "../artwork"
import { connectionFromArray } from "graphql-relay"
import { pageable } from "relay-cursor-paging"
import gql from "lib/gql"
import uuid from "uuid/v5"

export const generateUuid = (userId: string) => {
  if (!userId) return ""
  return uuid(userId, uuid.DNS).toString()
}

export const generateBeacon = (namespace: string, identifier: string) => {
  // TODO: Understand why localhost works here and weaviate://weaviate.stg.artsy.net doesn't
  return `weaviate://localhost/${namespace}/${identifier}`
}

export const DiscoverArtworks: GraphQLFieldConfig<void, ResolverContext> = {
  type: artworkConnection.connectionType,
  args: pageable({
    userId: { type: GraphQLString },
    limit: { type: GraphQLInt },
  }),
  resolve: async (_root, args, { weaviateGraphqlLoader, artworksLoader }) => {
    if (!weaviateGraphqlLoader) return

    const { userId, limit = 5 } = args

    const userUUID = generateUuid(userId)
    const beacon = generateBeacon("InfiniteDiscoveryUsers", userUUID)

    const query = gql`
      {
        Get {
          InfiniteDiscoveryArtworks(nearObject: {beacon: "${beacon}"}, limit: ${limit}) {
            internalID
            _additional {
              id
            }
          }
        }
      }
    `

    const body = await weaviateGraphqlLoader({
      query,
    })()

    if (!body.data.Get.InfiniteDiscoveryArtworks)
      return connectionFromArray([], args)

    const artworkIds = body.data.Get.InfiniteDiscoveryArtworks.map(
      (node) => node.internalID
    )

    const artworks =
      artworkIds?.length > 0 ? await artworksLoader({ ids: artworkIds }) : []

    return connectionFromArray(artworks, args)
  },
}
