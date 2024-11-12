import {
  GraphQLString,
  GraphQLFieldConfig,
  GraphQLInt,
  GraphQLEnumType,
  GraphQLFloat,
  GraphQLNonNull,
  GraphQLBoolean,
} from "graphql"
import { ResolverContext } from "types/graphql"
import { artworkConnection } from "../artwork"
import { connectionFromArray } from "graphql-relay"
import { pageable } from "relay-cursor-paging"
import gql from "lib/gql"
import uuid from "uuid/v5"
import { sampleSize } from "lodash"

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
    userId: { type: GraphQLNonNull(GraphQLString) },
    limit: { type: GraphQLInt },
    offset: { type: GraphQLInt },
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
    useRelatedArtworks: { type: GraphQLBoolean, defaultValue: false },
  }),
  resolve: async (
    _root,
    args,
    {
      weaviateCreateObjectLoader,
      weaviateGraphqlLoader,
      artworksLoader,
      relatedArtworksLoader,
      marketingCollectionLoader,
      savedArtworksLoader,
    }
  ) => {
    if (
      !artworksLoader ||
      !weaviateGraphqlLoader ||
      !weaviateCreateObjectLoader
    ) {
      new Error("A loader is not available")
    }

    const {
      userId,
      limit = 5,
      offset = 0,
      certainty = 0.5,
      sort,
      useRelatedArtworks,
    } = args

    if (useRelatedArtworks) {
      if (!savedArtworksLoader) {
        return new Error("You need to be signed in to perform this action")
      }

      const { body: savedArtworks } = await savedArtworksLoader({
        size: 28,
        sort: "-position",
        user_id: userId,
        private: true,
      })

      // Extract saved artwork IDs
      const savedArtworkIds = savedArtworks.map((artwork) => artwork.id)

      // Load curated artworks
      const curatedArtworks = await marketingCollectionLoader("curators-picks")
      const curatedArtworkIds = curatedArtworks.map((artwork) => artwork.id)
      // Select two random artworks from curated artworks
      const randomCuratedArtworks = sampleSize(curatedArtworks, 2)

      // Combine IDs: use curated if no saved artworks, otherwise combine
      const finalArtworkIds =
        savedArtworkIds.length > 0 ? [...savedArtworkIds] : curatedArtworkIds

      // Limit the number of artwork IDs to a maximum of 30
      const queryArtworkIds = finalArtworkIds.slice(0, 30)

      // Fetch related artworks based on limited artwork IDs
      const relatedArtworks = await relatedArtworksLoader({
        artwork_id: queryArtworkIds,
        size: 8,
      })

      // inject two random curated artworks
      const finalArtworks = [...relatedArtworks, ...randomCuratedArtworks]
      return connectionFromArray(finalArtworks, args)
    }

    const userUUID = generateUuid(userId)
    const beacon = generateBeacon("InfiniteDiscoveryUsers", userUUID)

    const userQuery = gql`
      {
        Get {
          InfiniteDiscoveryUsers(
            where: { path: ["internalID"], operator: Equal, valueString: "${userId}" }
          ) {
            likedArtworks {
              ... on InfiniteDiscoveryArtworks {
                internalID
              }
            }
            seenArtworks  {
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

    let user = userQueryResponse?.data?.Get?.InfiniteDiscoveryUsers?.[0]

    // If user doesn't exist, create it
    if (!user) {
      try {
        const body = {
          class: "InfiniteDiscoveryUsers",
          id: userUUID,
          properties: {
            internalID: userId,
          },
        }
        user = await weaviateCreateObjectLoader("/objects", body)
      } catch (error) {
        throw new Error(`Error creating user in Weaviate: ${error}`)
      }
    }

    const likedArtworkIds =
      user.likedArtworks?.map((node) => node.internalID) || []
    const seenArtworkIds =
      user.seenArtworks?.map((node) => node.internalID) || []
    const artworkIdsToFilter = [...likedArtworkIds, ...seenArtworkIds]

    let searchQuery

    if (likedArtworkIds.length > 0) {
      searchQuery = gql`
      {
        Get {
          InfiniteDiscoveryArtworks(
              nearObject: {
                beacon: "${beacon}",
                certainty: ${certainty}
              },
              limit: ${limit},
              offset: ${offset},
          ) {
            internalID
            _additional {
              id
            }
          }
        }
      }
    `
    } else {
      searchQuery = gql`
      {
        Get {
          InfiniteDiscoveryArtworks(
              limit: ${limit},
              offset: ${offset},
          ) {
            internalID
            _additional {
              id
            }
          }
        }
      }`
    }

    const body = await weaviateGraphqlLoader({
      query: searchQuery,
    })()

    if (!body.data.Get.InfiniteDiscoveryArtworks)
      return connectionFromArray([], args)

    const artworkIds = body.data.Get.InfiniteDiscoveryArtworks.map(
      (node) => node.internalID
    )

    // Remove liked artworks from the list
    const filteredArtworkIds = artworkIds.filter(
      (id) => artworkIdsToFilter.indexOf(id) === -1
    )

    if (sort == "certainty") {
      filteredArtworkIds.reverse()
    }

    const artworks =
      filteredArtworkIds?.length > 0
        ? await artworksLoader({ ids: filteredArtworkIds })
        : []

    return connectionFromArray(artworks, args)
  },
}
