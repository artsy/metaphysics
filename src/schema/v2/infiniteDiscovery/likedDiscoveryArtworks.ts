import {
  GraphQLString,
  GraphQLFieldConfig,
  GraphQLNonNull,
  GraphQLInt,
} from "graphql"
import { ResolverContext } from "types/graphql"
import { artworkConnection } from "../artwork"
import { connectionFromArray } from "graphql-relay"
import { pageable } from "relay-cursor-paging"
import gql from "lib/gql"

export const LikedDiscoveryArtworks: GraphQLFieldConfig<
  void,
  ResolverContext
> = {
  type: artworkConnection.connectionType,
  args: pageable({
    userId: { type: GraphQLNonNull(GraphQLString) },
    limit: { type: GraphQLInt },
  }),
  resolve: async (_root, args, { weaviateGraphqlLoader, artworksLoader }) => {
    if (!weaviateGraphqlLoader || !artworksLoader) {
      new Error("A loader is not available")
    }
    const { userId, limit } = args

    const userQuery = gql`
      {
        Get {
          InfiniteDiscoveryUsers(
            where: { path: ["internalID"], operator: Equal, valueString: "${userId}" },
            limit: ${limit}
          ) {
            likedArtworks {
              ... on InfiniteDiscoveryArtworks {
                internalID
              }
            }
          }
        }
      }
    `
    const userQueryResponse = await weaviateGraphqlLoader({
      query: userQuery,
    })()

    const user = userQueryResponse?.data?.Get?.InfiniteDiscoveryUsers?.[0]

    const likedArtworkIds =
      user?.likedArtworks?.map((node) => node.internalID) || []

    const artworks =
      likedArtworkIds?.length > 0
        ? await artworksLoader({ ids: likedArtworkIds })
        : []

    return connectionFromArray(artworks, args)
  },
}
