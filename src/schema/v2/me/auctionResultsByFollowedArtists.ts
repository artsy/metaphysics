import {
  GraphQLBoolean,
  GraphQLFieldConfig,
  GraphQLInt,
  GraphQLList,
  GraphQLString,
} from "graphql"
import { connectionFromArraySlice } from "graphql-relay"
import { convertConnectionArgsToGravityArgs } from "lib/helpers"
import { compact, merge, uniq } from "lodash"
import { pageable } from "relay-cursor-paging"
import { createPageCursors } from "schema/v2/fields/pagination"
import { ResolverContext } from "types/graphql"
import ArtworkSizes from "../artwork/artworkSizes"
import {
  auctionResultConnection,
  AuctionResultSorts,
  AuctionResultsState,
} from "../auction_result"
import { allFollowedArtistsLoader } from "lib/loaders/helpers"

const AuctionResultsByFollowedArtists: GraphQLFieldConfig<
  void,
  ResolverContext
> = {
  type: auctionResultConnection.connectionType,
  args: pageable({
    allowEmptyCreatedDates: {
      type: GraphQLBoolean,
      defaultValue: true,
      description: "Allow auction results with empty created date values",
    },
    categories: {
      type: new GraphQLList(GraphQLString),
      description: "Filter auction results by category (medium)",
    },
    earliestCreatedYear: {
      type: GraphQLInt,
      description: "Filter auction results by earliest created at year",
    },
    organizations: {
      type: new GraphQLList(GraphQLString),
      description: "Filter auction results by organizations",
    },
    latestCreatedYear: {
      type: GraphQLInt,
      description: "Filter auction results by latest created at year",
    },
    recordsTrusted: {
      type: GraphQLBoolean,
      defaultValue: false,
      description: "When true, will only return records for allowed artists.",
    },
    sizes: {
      type: new GraphQLList(ArtworkSizes),
      description: "Filter auction results by Artwork sizes",
    },
    sort: AuctionResultSorts,
    state: AuctionResultsState,
  }),
  description: "A list of the auction results by followed artists",
  resolve: async (
    _root,
    options,
    { followedArtistsLoader, auctionLotsLoader }
  ) => {
    try {
      if (!followedArtistsLoader || !auctionLotsLoader) return null

      const followedArtists = await allFollowedArtistsLoader(
        followedArtistsLoader
      )

      const followedArtistIds = uniq(
        compact(followedArtists.map((artist) => artist?.artist?._id))
      )

      if (!followedArtistIds || followedArtistIds.length === 0) {
        return null
      }

      const {
        page,
        size,
        offset,
        sizes,
        organizations,
        categories,
      } = convertConnectionArgsToGravityArgs(options)

      const diffusionArgs = {
        allow_empty_created_dates: options.allowEmptyCreatedDates,
        artist_ids: followedArtistIds,
        categories,
        earliest_created_year: options.earliestCreatedYear,
        latest_created_year: options.latestCreatedYear,
        organizations,
        page,
        size,
        sizes,
        sort: options.sort,
        state: options.state,
      }

      return auctionLotsLoader(diffusionArgs).then(
        ({ total_count, _embedded }) => {
          const totalPages = Math.ceil(total_count / size)

          // filter items without artist id
          const filteredAuctionResults = _embedded.items.filter(
            (auctionResult) => auctionResult.artist_id
          )

          // enrich result with artist data
          const enrichedAuctionResults = filteredAuctionResults.map(
            (auctionResult) => {
              const artist = followedArtists.find(
                (artist) => artist?.artist?._id == auctionResult.artist_id
              )
              auctionResult.artist = artist?.artist
              return auctionResult
            }
          )

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
            connectionFromArraySlice(enrichedAuctionResults, options, {
              arrayLength: total_count,
              sliceStart: offset,
            }),
            {
              pageInfo: {
                hasPreviousPage: page > 1,
                hasNextPage: page < totalPages,
              },
            },
            {
              artist_ids: followedArtistIds,
            }
          )
        }
      )
    } catch (error) {
      console.error(error)
      throw new Error(error)
    }
  },
}

export default AuctionResultsByFollowedArtists
