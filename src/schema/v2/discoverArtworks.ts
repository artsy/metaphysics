import { GraphQLString, GraphQLFieldConfig, GraphQLInt } from "graphql"
import { ResolverContext } from "types/graphql"
import { artworkConnection } from "./artwork"
import { connectionFromArray } from "graphql-relay"
import { pageable } from "relay-cursor-paging"
import gql from "lib/gql"
import config from "config"
import { URL } from "url"
import uuid from "uuid/v5"

export const generateUuid = (userId: string) => {
  if (!userId) return ""
  return uuid(userId, uuid.DNS).toString()
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
    const { WEAVIATE_API_BASE } = config

    const userUUID = generateUuid(userId)

    const hostName = new URL(WEAVIATE_API_BASE as string).hostname
    const beacon = `weaviate://${hostName}/InfiniteDiscoveryUsers/${userUUID}`

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
