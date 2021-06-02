import { GraphQLFieldConfig } from "graphql"
import { connectionFromArraySlice } from "graphql-relay"
import { convertConnectionArgsToGravityArgs } from "lib/helpers"
import { merge } from "lodash"
import { pageable } from "relay-cursor-paging"
import { createPageCursors } from "schema/v1/fields/pagination"
import { params } from "schema/v1/home/add_generic_genes"
import { ResolverContext } from "types/graphql"
import { auctionResultConnection } from "../auction_result"

const AuctionResultsByFollowedArtists: GraphQLFieldConfig<
  void,
  ResolverContext
> = {
  type: auctionResultConnection.connectionType,
  args: pageable({}),
  description: "A list of the auction results by followed artists",
  resolve: async (
    _root,
    options,
    { followedArtistsLoader, auctionLotsLoader }
  ) => {
    try {
      if (!followedArtistsLoader || !auctionLotsLoader) return null

      const gravityArgs = {
        size: 50,
        offset: 0,
        total_count: false,
        ...params,
      }
      const { body: followedArtists } = await followedArtistsLoader(gravityArgs)

      // TODO make it possible!
      const followedArtistIds = followedArtists.map((artist) => artist.id)

      const {
        page,
        size,
        offset,
        sizes,
        organizations,
        categories,
      } = convertConnectionArgsToGravityArgs(options)
      const diffusionArgs = {
        page,
        size,
        // artist_ids: followedArtistIds,
        artist_id: "4dd1584de0091e000100207c",
        organizations,
        categories,
        earliest_created_year: options.earliestCreatedYear,
        latest_created_year: options.latestCreatedYear,
        allow_empty_created_dates: options.allowEmptyCreatedDates,
        sizes,
        sort: options.sort,
      }

      const { total_count, _embedded } = await auctionLotsLoader(diffusionArgs)
      const totalPages = Math.ceil(total_count / size)

      return merge(
        {
          pageCursors: createPageCursors(
            {
              page,
              size,
            },
            total_count
          ),
        },
        {
          totalCount: total_count,
        },
        connectionFromArraySlice(_embedded.items, options, {
          arrayLength: total_count,
          sliceStart: offset,
        }),
        {
          pageInfo: {
            hasPreviousPage: page > 1,
            hasNextPage: page < totalPages,
          },
        }
      )
    } catch (error) {
      console.log(error)
      throw new Error(error)
    }
  },
}

export default AuctionResultsByFollowedArtists
