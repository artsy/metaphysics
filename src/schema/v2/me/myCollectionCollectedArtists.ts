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

    // TODO: Remove this once all clients pass includePersonalArtists correctly
    // This is a hack we need to return the correct results for older cleints that don't send the param `includePersonalArtists`.
    // With this solution we are defaulting to true if the query comes from the My Collection artwork form (which is the only query that passes `first: 100`)
    const SIZE_ARG_VALUE_FOR_MY_COLLECTION_ARTWORK_FORM = 100
    const includePersonalArtists =
      args.first === SIZE_ARG_VALUE_FOR_MY_COLLECTION_ARTWORK_FORM
        ? true
        : args.includePersonalArtists

    const {
      body: userInterests,
      headers: userInterestsheader,
    } = await meUserInterestsLoader({
      interest_type: "Artist",
      category: "collected_before",
      size,
      page,
      total_count: true,
    })

    const { body: artists } = await collectionArtistsLoader("my-collection", {
      size: userInterests.length,
      sort,
      user_id: userID,
      include_personal_artists: includePersonalArtists,
      artist_ids: userInterests.map((interest) => interest.internalID),
    })

    const totalCount = parseInt(userInterestsheader["x-total-count"] || "0", 10)

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
