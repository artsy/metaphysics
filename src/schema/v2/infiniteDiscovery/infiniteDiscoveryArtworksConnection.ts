import {
  GraphQLFieldConfig,
  GraphQLFloat,
  GraphQLList,
  GraphQLString,
} from "graphql"
import { ResolverContext } from "types/graphql"
import { artworkConnection } from "../artwork"
import { pageable } from "relay-cursor-paging"
import { connectionFromArray } from "graphql-relay"
import { getInitialArtworksSample } from "lib/infiniteDiscovery/getInitialArtworksSample"
import { findSimilarArtworks } from "lib/infiniteDiscovery/findSimilarArtworks"
import { calculateMeanArtworksVector } from "lib/infiniteDiscovery/calculateMeanArtworksVector"

export const InfiniteDiscoveryArtworksConnection: GraphQLFieldConfig<
  void,
  ResolverContext
> = {
  type: artworkConnection.connectionType,
  description:
    "Returns artworks connection based on similarity between user taste profile and artworks",
  args: pageable({
    excludeArtworkIds: {
      type: new GraphQLList(GraphQLString),
      description:
        "Exclude these artworks from the response, currently works only in combination with tasteProfileVector",
    },
    likedArtworkIds: {
      type: new GraphQLList(GraphQLString),
      description:
        "If tasteProfileVector is not provided, these artworks are used to calculate the taste profile vector. Previously liked artworks are excluded from the response",
    },
    tasteProfileVector: {
      type: new GraphQLList(GraphQLFloat),
    },
  }),
  resolve: async (_root, args, { artworksLoader }) => {
    const {
      excludeArtworkIds: _excludeArtworkIds,
      first,
      likedArtworkIds,
      tasteProfileVector: _tasteProfileVector,
    } = args

    let tasteProfileVector = _tasteProfileVector
    const excludeArtworkIds = _excludeArtworkIds

    if (!_tasteProfileVector && likedArtworkIds) {
      tasteProfileVector = await calculateMeanArtworksVector(likedArtworkIds)
    }

    if (likedArtworkIds) {
      // we don't want to recommend the same artworks that the user already liked
      excludeArtworkIds.push(...likedArtworkIds)
    }

    let result = []

    if (!tasteProfileVector) {
      result = await getInitialArtworksSample(first, artworksLoader)
    } else {
      result = await findSimilarArtworks(
        tasteProfileVector,
        first,
        excludeArtworkIds,
        artworksLoader
      )
    }

    return connectionFromArray(result, args)
  },
}
