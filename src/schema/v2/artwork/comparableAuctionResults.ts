import { GraphQLFieldConfig } from "graphql"
import { connectionFromArraySlice } from "graphql-relay"
import { convertConnectionArgsToGravityArgs } from "lib/helpers"
import { isNull, merge, omitBy } from "lodash"
import { pageable } from "relay-cursor-paging"
import { ResolverContext } from "types/graphql"
import { auctionResultConnection } from "../auction_result"
import { createPageCursors } from "../fields/pagination"

export const ComparableAuctionResults: GraphQLFieldConfig<
  any,
  ResolverContext
> = {
  type: auctionResultConnection.connectionType,
  description: "Comparable auction results",
  args: pageable({}),
  resolve: async (artwork, options, { comparableAuctionResultsLoader }) => {
    if (!comparableAuctionResultsLoader) {
      return null
    }

    const { page, size, offset } = convertConnectionArgsToGravityArgs(options)

    const comparableAuctionResultsParams = {
      artist_id: artwork.artist._id,
      date: artwork.date,
      height_cm: artwork.height_cm,
      width_cm: artwork.width_cm,
      depth_cm: artwork.depth_cm,
      diameter_cm: artwork.diameter_cm,
    }

    const {
      _embedded: { items },
      total_count: totalCount,
    } = await comparableAuctionResultsLoader(
      omitBy(comparableAuctionResultsParams, isNull)
    )

    return merge(
      {
        pageCursors: createPageCursors(
          {
            page,
            size,
          },
          totalCount
        ),
      },
      {
        totalCount,
      },
      connectionFromArraySlice(items, options, {
        arrayLength: totalCount,
        sliceStart: offset,
      })
    )
  },
}
