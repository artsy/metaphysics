import { 
  GraphQLFieldConfig,
  GraphQLBoolean,
  GraphQLString,
  GraphQLList,
  GraphQLInt,
} from "graphql"
import { pageable } from "relay-cursor-paging"
import { params } from "schema/v1/home/add_generic_genes"
import { ResolverContext } from "types/graphql"
import { auctionResultConnection, AuctionResultSorts } from "../auction_result"
import { convertConnectionArgsToGravityArgs } from "lib/helpers"
import { merge } from "lodash"
import { createPageCursors } from "schema/v2/fields/pagination"
import { connectionFromArraySlice } from "graphql-relay"
import ArtworkSizes from "../artwork/artworkSizes"

const MAX_FOLLOWED_ARTISTS = 50

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
      description:
        "When true, will only return records for allowed artists.",
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
  description: "A list of the auction results by followed artists",
  resolve: async (
    _root,
    options,
    { followedArtistsLoader, auctionLotsLoader }
  ) => {
    try {
      if (!followedArtistsLoader || !auctionLotsLoader) return null

      const gravityArgs = {
        size: MAX_FOLLOWED_ARTISTS,
        offset: 0,
        total_count: false,
        ...params,
      }
      const { body: followedArtists } = await followedArtistsLoader(gravityArgs)

      const followedArtistIds = followedArtists.map(
        (artist) => artist.artist._id
      )

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
        artist_ids: followedArtistIds,
        organizations,
        categories,
        earliest_created_year: options.earliestCreatedYear,
        latest_created_year: options.latestCreatedYear,
        allow_empty_created_dates: options.allowEmptyCreatedDates,
        sizes,
        sort: options.sort,
      }

      return auctionLotsLoader(diffusionArgs).then(
        ({ total_count, _embedded }) => {
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
