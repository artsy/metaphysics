import {
  GraphQLBoolean,
  GraphQLFieldConfig,
  GraphQLInt,
  GraphQLList,
  GraphQLString,
} from "graphql"
import { connectionFromArraySlice } from "graphql-relay"
import { convertConnectionArgsToGravityArgs } from "lib/helpers"
import { compact, merge } from "lodash"
import { pageable } from "relay-cursor-paging"
import { params } from "schema/v2/home/add_generic_genes"
import { createPageCursors } from "schema/v2/fields/pagination"
import { ResolverContext } from "types/graphql"
import ArtworkSizes from "../artwork/artworkSizes"
import { auctionResultConnection, AuctionResultSorts } from "../auction_result"

const MAX_FOLLOWED_ARTISTS_PER_STEP = 100
const MAX_STEPS = 2

const AuctionResultsByFollowedArtists: GraphQLFieldConfig<
  void,
  ResolverContext
> = {
  type: auctionResultConnection.connectionType,
  args: pageable({
    sort: AuctionResultSorts,
    organizations: {
      type: new GraphQLList(GraphQLString),
      description: "Filter auction results by organizations",
    },
    sizes: {
      type: new GraphQLList(ArtworkSizes),
      description: "Filter auction results by Artwork sizes",
    },
    categories: {
      type: new GraphQLList(GraphQLString),
      description: "Filter auction results by category (medium)",
    },
    recordsTrusted: {
      type: GraphQLBoolean,
      defaultValue: false,
      description: "When true, will only return records for allowed artists.",
    },
    earliestCreatedYear: {
      type: GraphQLInt,
      description: "Filter auction results by earliest created at year",
    },
    latestCreatedYear: {
      type: GraphQLInt,
      description: "Filter auction results by latest created at year",
    },
    allowEmptyCreatedDates: {
      type: GraphQLBoolean,
      defaultValue: true,
      description:
        "Filter auction results by empty artwork created date values",
    },
    includeUpcoming: {
      type: GraphQLBoolean,
      defaultValue: true,
      description: "Include upcoming auction results",
    },
  }),
  description: "A list of the auction results by followed artists",
  resolve: async (
    _root,
    options,
    { followedArtistsLoader, auctionLotsLoader }
  ) => {
    try {
      if (!followedArtistsLoader || !auctionLotsLoader) return null

      let followedArtists: any[] = []

      // Since we cannot query more than 100  artists at a time, we have to do this in several steps.
      for (let step = 0; step < MAX_STEPS; step++) {
        const gravityArgs = {
          size: MAX_FOLLOWED_ARTISTS_PER_STEP,
          offset: step,
          total_count: false,
          ...params,
        }
        const { body } = await followedArtistsLoader(gravityArgs)

        followedArtists = [...followedArtists, ...body]

        if (body.followedArtists < MAX_FOLLOWED_ARTISTS_PER_STEP) {
          break
        }
      }

      const followedArtistIds = compact(
        followedArtists.map((artist) => artist?.artist?._id)
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
        upcoming: options.includeUpcoming,
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
