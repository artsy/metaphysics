import {
  GraphQLString,
  GraphQLFieldConfig,
  GraphQLInt,
  GraphQLFloat,
  GraphQLList,
} from "graphql"
import { ResolverContext } from "types/graphql"
import { artworkConnection } from "../artwork"
import { connectionFromArray } from "graphql-relay"
import { pageable } from "relay-cursor-paging"
import { getInitialArtworksSample } from "lib/infiniteDiscovery/getInitialArtworksSample"
import { calculateMeanArtworksVector } from "lib/infiniteDiscovery/calculateMeanArtworksVector"
import { findSimilarArtworks } from "lib/infiniteDiscovery/findSimilarArtworks"

export const DiscoverArtworks: GraphQLFieldConfig<void, ResolverContext> = {
  type: artworkConnection.connectionType,
  args: pageable({
    limit: { type: GraphQLInt },
    excludeArtworkIds: {
      type: new GraphQLList(GraphQLString),
      description:
        "(Only for when useOpenSearch is true) Exclude these artworks from the response",
    },
    mltFields: {
      type: new GraphQLList(GraphQLString),
      description:
        "(Only for when useOpenSearch is true) These fields are used to calculate the More Like This query",
      defaultValue: ["genes", "materials", "tags", "medium"],
    },
    likedArtworkIds: {
      type: new GraphQLList(GraphQLString),
      description:
        "(Only for when useOpenSearch is true) These artworks are used to calculate the taste profile vector. Such artworks are excluded from the response",
    },
    osWeights: {
      type: new GraphQLList(GraphQLFloat),
      description:
        "(Only for when useOpenSearch is true) Weights for the OpenSearch query",
      defaultValue: [0.6, 0.4],
    },
    curatedPicksSize: {
      type: GraphQLInt,
      description:
        "The number of curated artworks to return. This is a temporary field to support the transition to OpenSearch",
      defaultValue: 2,
    },
  }),
  resolve: async (_root, args, { artworksLoader }) => {
    if (!artworksLoader) {
      new Error("A loader is not available")
    }

    const { limit = 10, mltFields, osWeights, curatedPicksSize } = args

    const { excludeArtworkIds = [], likedArtworkIds = [] } = args

    let result: any = []

    if (likedArtworkIds.length < 3) {
      result = await getInitialArtworksSample(
        limit,
        excludeArtworkIds,
        artworksLoader
      )
    } else {
      const tasteProfileVector = await calculateMeanArtworksVector(
        likedArtworkIds
      )
      // we don't want to recommend the same artworks that the user already liked
      excludeArtworkIds.push(...likedArtworkIds)

      const options = {
        vectorEmbedding: tasteProfileVector,
        size: limit,
        likedArtworkIds,
        excludeArtworkIds,
        fields: mltFields,
        weights: osWeights,
      }

      result = await findSimilarArtworks(options, artworksLoader)
      result = result.slice(0, limit - curatedPicksSize)

      // backfill with random curated picks if we don't have enough similar artworks
      const randomArtworks = await getInitialArtworksSample(
        limit - result.length === curatedPicksSize
          ? curatedPicksSize
          : limit - result.length,
        excludeArtworkIds,
        artworksLoader
      )
      result.push(...randomArtworks)
    }

    return connectionFromArray(result, args)
  },
}
