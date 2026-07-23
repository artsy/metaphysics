import {
  GraphQLBoolean,
  GraphQLFieldConfig,
  GraphQLInt,
  GraphQLList,
  GraphQLNonNull,
  GraphQLString,
} from "graphql"
import { connectionFromArraySlice } from "graphql-relay"
import { convertConnectionArgsToGravityArgs } from "lib/helpers"
import { uniqBy } from "lodash"
import { CursorPageable, pageable } from "relay-cursor-paging"
import { artworkConnection } from "schema/v2/artwork"
import { createPageCursors } from "schema/v2/fields/pagination"
import { ResolverContext } from "types/graphql"
import {
  getBackfillArtworks,
  getNewForYouArtworkIDs,
  getNewForYouArtworks,
} from "./helpers"

export const artworksForUser: GraphQLFieldConfig<void, ResolverContext> = {
  description: "A connection of artworks for a user.",
  type: artworkConnection.connectionType,
  args: pageable({
    includeBackfill: { type: new GraphQLNonNull(GraphQLBoolean) },
    page: { type: GraphQLInt },
    userId: { type: GraphQLString },
    version: { type: GraphQLString },
    maxWorksPerArtist: { type: GraphQLInt },
    marketable: { type: GraphQLBoolean },
    backfillMarketingCollectionID: {
      type: GraphQLString,
      description: "The ID of the marketing collection to be used for backfill",
    },
    onlyAtAuction: {
      type: GraphQLBoolean,
      defaultValue: false,
    },
    excludeDislikedArtworks: {
      type: GraphQLBoolean,
      defaultValue: false,
    },
    excludeArtworkIds: {
      type: new GraphQLList(GraphQLString),
      defaultValue: [],
    },
  }),
  resolve: async (_root, args: CursorPageable, context) => {
    if (args.backfillMarketingCollectionID && !args.includeBackfill) {
      throw new Error(
        "includeBackfill is required when backfillMarketingCollectionID is true"
      )
    }

    const gravityArgs = convertConnectionArgsToGravityArgs(args)
    const { page, size, offset } = gravityArgs

    const newForYouArtworkIds = await getNewForYouArtworkIDs(
      gravityArgs,
      context
    )

    const filteredArtworkIds = newForYouArtworkIds.filter(
      (artworkId) => !args.excludeArtworkIds.includes(artworkId)
    )

    // Hydrate before paginating: Gravity silently drops stale ids, so slicing
    // the id window first would let backfill fill a mid-page gap.
    const newForYouArtworks = await getNewForYouArtworks(
      {
        ids: filteredArtworkIds,
        marketable: args.marketable,
        excludeDislikedArtworks: args.excludeDislikedArtworks,
      },
      context
    )

    // Assumes the id source returned the full set (nwfy/Vortex). onlyAtAuction
    // pre-paginates via its own loader, so it's page-1-correct only there —
    // pre-existing behavior, unchanged here.
    const recsCount = newForYouArtworks.length
    const pageRecs = newForYouArtworks.slice(offset, offset + size)

    // Connection is the virtual concat [...recs, ...backfill]; offset the
    // backfill window past the recs so pages draw disjoint slices. This relies
    // on recsCount staying stable across a client's page requests — if a rec
    // goes stale mid-pagination the offset shifts and a boundary backfill item
    // can repeat or skip, which is inherent to recommendation instability.
    const {
      artworks: backfillArtworks,
      totalCount: backfillArtworksTotalCount,
    } = await getBackfillArtworks({
      size: size || 0,
      offset: Math.max(0, offset - recsCount),
      includeBackfill: args.includeBackfill,
      context,
      marketingCollectionId: args.backfillMarketingCollectionID,
      onlyAtAuction: args.onlyAtAuction,
      excludeDislikedArtworks: args.excludeDislikedArtworks,
    })

    const artworks = uniqBy(pageRecs.concat(backfillArtworks), "id").slice(
      0,
      size
    )

    const totalCount = recsCount + (backfillArtworksTotalCount ?? 0)

    return {
      totalCount,
      pageCursors: createPageCursors({ ...args, page, size }, totalCount),
      ...connectionFromArraySlice(artworks, args, {
        arrayLength: totalCount,
        sliceStart: offset,
      }),
    }
  },
}
