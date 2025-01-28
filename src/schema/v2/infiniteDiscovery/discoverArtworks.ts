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

export const DiscoverArtworks: GraphQLFieldConfig<void, ResolverContext> = {
  type: artworkConnection.connectionType,
  args: pageable({
    limit: { type: GraphQLInt, defaultValue: 5 },
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
      description: "The number of curated artworks to return.",
      defaultValue: 2,
    },
  }),
  resolve: async (_root, args, { artworksDiscoveryLoader, meLoader }) => {
    if (!meLoader || !artworksDiscoveryLoader) {
      throw new Error("You need to be signed in to perform this action")
    }

    const me = await meLoader()

    const gravityArgs = {
      limit: args.limit,
      exclude_artwork_ids: args.excludeArtworkIds,
      mlt_fields: args.mltFields,
      liked_artwork_ids: args.likedArtworkIds,
      os_weights: args.osWeights,
      curated_picks_size: args.curatedPicksSize,
      user_id: me.id,
    }

    const gravityResponse = await artworksDiscoveryLoader(gravityArgs)

    return connectionFromArray(gravityResponse, {
      first: args.limit,
    })
  },
}
