import {
  GraphQLString,
  GraphQLFieldConfig,
  GraphQLInt,
  GraphQLEnumType,
  GraphQLFloat,
} from "graphql"
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
    certainty: { type: GraphQLFloat },
    sort: {
      type: new GraphQLEnumType({
        name: "DiscoverArtworksSort",
        values: {
          CERTAINTY_ASC: {
            value: "certainty",
            description:
              "Sort by certainty ascending. High certainty means the artwork is more likely to be recommended.",
          },
          CERTAINTY_DESC: {
            value: "-certainty",
            description:
              "Sort by certainty descending. High certainty means the artwork is more likely to be recommended.",
          },
        },
      }),
    },
  }),
  resolve: async (_root, args, { weaviateGraphqlLoader, artworksLoader }) => {
    if (!weaviateGraphqlLoader) return

    const { userId, limit = 5, certainty = 0.5, sort } = args

    const userUUID = generateUuid(userId)
    const beacon = generateBeacon("InfiniteDiscoveryUsers", userUUID)

    const query = gql`
      {
        Get {
          InfiniteDiscoveryArtworks(
              nearObject: {
                beacon: "${beacon}", 
                certainty: ${certainty}
              },
              limit: ${limit},
          ) {
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

    if (sort == "certainty") {
      artworkIds.reverse()
    }

    const artworks =
      artworkIds?.length > 0 ? await artworksLoader({ ids: artworkIds }) : []

    return connectionFromArray(artworks, args)
  },
}
