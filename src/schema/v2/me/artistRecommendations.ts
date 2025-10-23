import { GraphQLEnumType, GraphQLFieldConfig, GraphQLInt } from "graphql"
import { connectionFromArray } from "graphql-relay"
import { convertConnectionArgsToGravityArgs, extractNodes } from "lib/helpers"
import { CursorPageable, pageable } from "relay-cursor-paging"
import { createPageCursors } from "schema/v2/fields/pagination"
import { ResolverContext } from "types/graphql"
import gql from "lib/gql"
import { artistConnection } from "schema/v2/artist"

// This limits the maximum number of artists we receive from Vortex and is related to how we implement the Connection in this resolver.
const MAX_ARTISTS = 50

const ArtistRecommendationSourceEnum = new GraphQLEnumType({
  name: "ArtistRecommendationSource",
  values: {
    HYBRID: {
      value: "HYBRID",
      description: "Hybrid machine learning-based recommendations from Vortex.",
    },
    SIMILAR_TO_FOLLOWED: {
      value: "SIMILAR_TO_FOLLOWED",
      description:
        "Based on UserSuggestedSimilarArtistsIndex in Gravity to find artists similar to the user's followed artists.",
    },
  },
})

/**
 * Fetches artists similar to those the user follows using UserSuggestedSimilarArtistsIndex index in Gravity.
 */
const fetchSimilarToFollowedArtists = async (
  page: number,
  size: number,
  suggestedSimilarArtistsLoader: any,
  args: any
) => {
  if (!suggestedSimilarArtistsLoader) {
    throw new Error(
      "A X-Access-Token header is required to perform this action."
    )
  }

  const loaderParams = {
    size,
    page,
    exclude_followed_artists: true,
    exclude_artists_without_forsale_artworks: true,
  }

  const { body } = await suggestedSimilarArtistsLoader(loaderParams)
  const artists = body ? body.map(({ artist }) => artist) : []

  return {
    totalCount: artists.length,
    pageCursors: createPageCursors({ page, size }, artists.length),
    ...connectionFromArray(artists, args),
  }
}

/**
 * Fetches hybrid ML-based recommendations from Vortex
 */
const fetchHybridRecommendations = async (
  page: number,
  size: number,
  context: ResolverContext,
  args: any
) => {
  const {
    artistsLoader,
    authenticatedLoaders: {
      vortexGraphqlLoader: vortexGraphQLAuthenticatedLoader,
    } = {},
    unauthenticatedLoaders: {
      vortexGraphqlLoader: vortexGraphQLUnauthenticatedLoader,
    } = {},
    xImpersonateUserID,
    userID,
  } = context

  if (!artistsLoader || !vortexGraphQLAuthenticatedLoader) return

  const userId = userID || xImpersonateUserID

  // Fetch artist IDs from Vortex
  const query = {
    query: gql`
        query artistRecommendationsQuery {
          artistRecommendations(first: ${MAX_ARTISTS}, userId: "${userId}") {
            totalCount
            edges {
              node {
                artistId
                score
              }
            }
          }
        }
      `,
  }

  const vortexLoader = xImpersonateUserID
    ? vortexGraphQLUnauthenticatedLoader
    : vortexGraphQLAuthenticatedLoader

  if (!vortexLoader) return

  const vortexResult = await vortexLoader(query)()

  const artistIds = extractNodes(vortexResult.data?.artistRecommendations).map(
    (node: any) => node?.artistId
  )

  // Fetch artist details from Gravity
  const artists = artistIds?.length
    ? (await artistsLoader({ ids: artistIds })).body
    : []

  return {
    totalCount: artists.length,
    pageCursors: createPageCursors({ ...args, page, size }, artists.length),
    ...connectionFromArray(artists, args),
  }
}

export const ArtistRecommendations: GraphQLFieldConfig<
  void,
  ResolverContext
> = {
  description: "A connection of artist recommendations for the current user.",
  type: artistConnection.connectionType,
  args: pageable({
    page: { type: GraphQLInt },
    source: {
      type: ArtistRecommendationSourceEnum,
      description: "The source/algorithm to use for recommendations",
      defaultValue: "HYBRID",
    },
  }),
  resolve: async (_root, args: CursorPageable, context) => {
    const { page, size } = convertConnectionArgsToGravityArgs(args)
    const source = args.source

    switch (source) {
      case "SIMILAR_TO_FOLLOWED":
        return fetchSimilarToFollowedArtists(
          page,
          size,
          context.suggestedSimilarArtistsLoader,
          args
        )

      case "HYBRID":
      default:
        return fetchHybridRecommendations(page, size, context, args)
    }
  },
}
