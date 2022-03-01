import { GraphQLFieldConfig } from "graphql"
import { connectionFromArraySlice } from "graphql-relay"
import { convertConnectionArgsToGravityArgs } from "lib/helpers"
import { merge } from "lodash"
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
  resolve: async (artwork, options, { comparablesLoader }) => {
    if (!comparablesLoader) {
      return null
    }

    const { page, size, offset } = convertConnectionArgsToGravityArgs(options)

    const {
      _embedded: { items },
      total_count: totalCount,
    } = await comparablesLoader({
      artist_id: artwork.artist.id,
      date: artwork.date,
      height_cm: artwork.height_cm,
      width_cm: artwork.width_cm,
      depth_cm: artwork.depth_cm,
      diameter_cm: artwork.diameter_cm,
    })

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
