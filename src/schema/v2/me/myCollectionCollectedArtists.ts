import { GraphQLBoolean, GraphQLFieldConfig, GraphQLInt } from "graphql"
import { convertConnectionArgsToGravityArgs } from "lib/helpers"
import { pageable } from "relay-cursor-paging"
import { ResolverContext } from "types/graphql"
import { artistConnection } from "../artist"
import { paginationResolver } from "../fields/pagination"
import ArtistSorts from "../sorts/artist_sorts"

export const MyCollectionCollectedArtists: GraphQLFieldConfig<
  any,
  ResolverContext
> = {
  description: "A connection of artists in the users' collection",
  type: artistConnection.connectionType,
  args: pageable({
    sort: ArtistSorts,
    page: { type: GraphQLInt },
    size: { type: GraphQLInt },
    includePersonalArtists: {
      type: GraphQLBoolean,
      defaultValue: false,
      description: "Include artists that have been created by the user.",
    },
  }),
  resolve: async (
    _root,
    args,
    { collectionArtistsLoader, meUserInterestsLoader, userID }
  ) => {
    if (!collectionArtistsLoader || !meUserInterestsLoader) return

    const { page, offset, size, sort } = convertConnectionArgsToGravityArgs(
      args
    )

    // Fetching the relvant artist user interests (collected_before) for the user (paginated).

    const {
      body: userInterests,
      headers: userInterestsHeader,
    } = await meUserInterestsLoader({
      interest_type: "Artist",
      category: "collected_before",
      size,
      page,
      total_count: true,
    })

    // Fetching the artists for the user interests in the users collection to get the `artworksCount` metadata field (by artist ID).

    const { body: artists } = await collectionArtistsLoader("my-collection", {
      size: userInterests.length,
      sort,
      user_id: userID,
      include_personal_artists: true,
      artist_ids: userInterests.map((interest) => interest.internalID),
    })

    const totalCount = parseInt(userInterestsHeader["x-total-count"] || "0", 10)

    // Augmenting the response with metadata related to the collection and the user interests ()`artworksCount` and `private`).

    const artistsWithMetadata = userInterests.map((userInterest) => {
      return {
        ...userInterest.interest,
        artworksCount:
          artists.find((artist) => userInterest.interest._id === artist._id)
            ?.artworks_count_within_collection || 0,
        private: userInterest.private,
      }
    })

    return paginationResolver({
      totalCount,
      offset,
      size,
      page,
      body: artistsWithMetadata,
      args,
      resolveNode: (artist) => artist,
    })
  },
}
