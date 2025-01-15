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
import config from "config"

export const DiscoverArtworks: GraphQLFieldConfig<void, ResolverContext> = {
  type: artworkConnection.connectionType,
  args: pageable({
    limit: { type: GraphQLInt },
    excludeArtworkIds: {
      type: new GraphQLList(GraphQLString),
      description: "Exclude these artworks from the response",
    },
    mltFields: {
      type: new GraphQLList(GraphQLString),
      description: "These fields are used for More Like This query",
      defaultValue: ["genes", "materials", "tags", "medium"],
    },
    likedArtworkIds: {
      type: new GraphQLList(GraphQLString),
      description:
        "These artworks are used to calculate the taste profile vector. Such artworks are excluded from the response",
    },
    osWeights: {
      type: new GraphQLList(GraphQLFloat),
      description: "Weights for the KNN and MLT query",
      defaultValue: [0.6, 0.4],
    },
    curatedPicksSize: {
      type: GraphQLInt,
      description:
        "The number of curated artworks to return. This is a temporary field to support the transition to OpenSearch",
      defaultValue: 2,
    },
    initialArtworksIndexName: {
      type: GraphQLString,
      description: "Which index to use to display initial batch of artworks",
      defaultValue: config.OPENSEARCH_ARTWORKS_INFINITE_DISCOVERY_INITIAL_INDEX,
    },
  }),
  resolve: async (_root, args, { artworksLoader }) => {
    if (!artworksLoader) {
      new Error("A loader is not available")
    }

    const {
      limit = 10,
      mltFields,
      osWeights,
      curatedPicksSize,
      initialArtworksIndexName,
    } = args

    const { excludeArtworkIds = [], likedArtworkIds = [] } = args

    let result: any = []

    if (likedArtworkIds.length < 3) {
      result = await getInitialArtworksSample(
        limit,
        excludeArtworkIds,
        artworksLoader,
        initialArtworksIndexName
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
        artworksLoader,
        initialArtworksIndexName
      )
      result.push(...randomArtworks)
    }

    return connectionFromArray(result, args)
  },
}
