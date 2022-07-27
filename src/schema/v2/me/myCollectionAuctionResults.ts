import {
  GraphQLBoolean,
  GraphQLFieldConfig,
  GraphQLInt,
  GraphQLList,
  GraphQLString,
} from "graphql"
import { connectionFromArraySlice } from "graphql-relay"
import { convertConnectionArgsToGravityArgs } from "lib/helpers"
import { merge } from "lodash"
import { pageable } from "relay-cursor-paging"
import { createPageCursors } from "schema/v2/fields/pagination"
import { ResolverContext } from "types/graphql"
import ArtworkSizes from "../artwork/artworkSizes"
import { auctionResultConnection, AuctionResultSorts } from "../auction_result"
import { MAX_ARTISTS } from "./myCollectionInfo"

const MyCollectionAuctionResults: GraphQLFieldConfig<any, ResolverContext> = {
  type: auctionResultConnection.connectionType,
  description: "A list of auction results from artists in My Collection",
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
  }),
  resolve: async (
    { id: userId },
    options,
    { collectionArtistsLoader, auctionLotsLoader }
  ) => {
    try {
      if (!collectionArtistsLoader || !auctionLotsLoader) return null

      const { body: artists } = await collectionArtistsLoader("my-collection", {
        user_id: userId,
        size: MAX_ARTISTS,
      })

      const artistIds = artists.map(({ _id }) => _id)

      if (!artistIds || artistIds.length === 0) {
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

      const auctionLotsLoaderArgs = {
        page,
        size,
        artist_ids: artistIds,
        organizations,
        categories,
        earliest_created_year: options.earliestCreatedYear,
        latest_created_year: options.latestCreatedYear,
        allow_empty_created_dates: options.allowEmptyCreatedDates,
        sizes,
        sort: options.sort,
      }

      const { total_count, _embedded } = await auctionLotsLoader(
        auctionLotsLoaderArgs
      )

      const totalPages = Math.ceil(total_count / size)

      // filter items without artist id
      const filteredAuctionResults = _embedded.items.filter(
        (auctionResult) => auctionResult.artist_id
      )

      // enrich result with artist data
      const enrichedAuctionResults = filteredAuctionResults.map(
        (auctionResult) => {
          const artist = artists.find(
            ({ _id }) => _id == auctionResult.artist_id
          )

          auctionResult.artist = artist
          return auctionResult
        }
      )

      return merge(
        { pageCursors: createPageCursors({ page, size }, total_count) },
        { totalCount: total_count },
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
          artist_ids: artistIds,
        }
      )
    } catch (error) {
      console.error(error)
      throw new Error(error)
    }
  },
}

export default MyCollectionAuctionResults
