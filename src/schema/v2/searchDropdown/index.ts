import {
  GraphQLEnumType,
  GraphQLFieldConfig,
  GraphQLInt,
  GraphQLList,
  GraphQLNonNull,
  GraphQLObjectType,
  GraphQLResolveInfo,
  GraphQLString,
} from "graphql"
import { ResolverContext } from "types/graphql"
import { ArtistType } from "schema/v2/artist"
import { ArtworkType } from "schema/v2/artwork"
import { isFieldRequested } from "lib/isFieldRequested"
import { TrendingWindow, trendingWindowFor } from "./trendingData"

// Values are the periods Vortex publishes, so one passes straight through as a
// request param.
const TrendingSearchPeriodEnum = new GraphQLEnumType({
  name: "TrendingSearchPeriod",
  description: "The rolling window a trending ranking was computed over.",
  values: {
    ONE_DAY: { value: "1d" },
    SEVEN_DAYS: { value: "7d" },
    THIRTY_DAYS: { value: "30d" },
  },
})

const rank = {
  type: new GraphQLNonNull(GraphQLInt),
}

const TrendingSearchArtistType = new GraphQLObjectType<any, ResolverContext>({
  name: "TrendingSearchArtist",
  fields: () => ({
    rank,
    internalID: { type: new GraphQLNonNull(GraphQLString) },
    artist: { type: ArtistType, resolve: ({ artist }) => artist },
  }),
})

const TrendingSearchArtworkType = new GraphQLObjectType<any, ResolverContext>({
  name: "TrendingSearchArtwork",
  fields: () => ({
    rank,
    internalID: { type: new GraphQLNonNull(GraphQLString) },
    artwork: { type: ArtworkType, resolve: ({ artwork }) => artwork },
  }),
})

/**
 * Hydrates ordered ids in a single loader call, dropping ids Gravity no longer
 * returns. Rank is assigned after that, so the list counts 1..n with no gaps.
 */
const hydrate = async (
  ids: string[],
  key: string,
  fetch: (ids: string[]) => Promise<any[]>
): Promise<any[]> => {
  if (ids.length === 0) return []

  const records = await fetch(ids)

  // Gravity doesn't guarantee response order, so map back by id.
  const byID = new Map<string, any>(
    records.map((record) => [record._id, record])
  )

  return ids
    .flatMap((internalID) => {
      const record = byID.get(internalID)
      return record ? [{ internalID, [key]: record }] : []
    })
    .map((entry, index) => ({ ...entry, rank: index + 1 }))
}

/**
 * `ArtistType.coverArtwork` costs one Gravity call per artist. Fetch them in
 * one call and stash them where that resolver picks them up. Artists whose
 * cover artwork is missing are left alone, so they keep the fallback path.
 */
const attachCoverArtworks = async (
  artists: any[],
  artworksLoader: ResolverContext["artworksLoader"]
) => {
  const ids = artists
    .map(({ cover_artwork_id }) => cover_artwork_id)
    .filter(Boolean)

  if (ids.length === 0) return

  const artworks = await artworksLoader({ ids, size: ids.length })
  const byID = new Map<string, any>(
    artworks.map((artwork) => [artwork._id, artwork])
  )

  artists.forEach((artist) => {
    const artwork = byID.get(artist.cover_artwork_id)
    if (!artwork) return
    artist._coverArtwork = { ...artwork, _id: `${artist.id}-coverArtwork` }
  })
}

const first = {
  type: GraphQLInt,
  description: "Limits the number of results returned.",
}

const take = (ids: string[], count?: number) =>
  count === undefined ? ids : ids.slice(0, count)

const TrendingSearchesType = new GraphQLObjectType<
  TrendingWindow,
  ResolverContext
>({
  name: "TrendingSearches",
  description: "Trending artists and artworks over a rolling window.",
  fields: () => ({
    period: { type: new GraphQLNonNull(TrendingSearchPeriodEnum) },
    label: {
      type: new GraphQLNonNull(GraphQLString),
    },
    artists: {
      // Nullable so a Gravity failure nulls this rail rather than the query.
      type: new GraphQLList(new GraphQLNonNull(TrendingSearchArtistType)),
      args: { first },
      resolve: async (
        { artistIDs },
        { first: count },
        { artistsLoader, artworksLoader },
        info: GraphQLResolveInfo
      ) => {
        const entries = await hydrate(
          take(artistIDs, count),
          "artist",
          async (ids) => {
            const { body } = await artistsLoader({ ids, size: ids.length })
            return body
          }
        )

        if (isFieldRequested("artist.coverArtwork", info)) {
          try {
            await attachCoverArtworks(
              entries.map(({ artist }) => artist),
              artworksLoader
            )
          } catch {
            // Images are secondary: leave _coverArtwork unset so each artist
            // falls back to the per-artist path rather than nulling the rail.
          }
        }

        return entries
      },
    },
    artworks: {
      type: new GraphQLList(new GraphQLNonNull(TrendingSearchArtworkType)),
      args: { first },
      resolve: ({ artworkIDs }, { first: count }, { artworksLoader }) =>
        hydrate(take(artworkIDs, count), "artwork", (ids) =>
          artworksLoader({ ids, size: ids.length })
        ),
    },
  }),
})

const trendingSearchesField: GraphQLFieldConfig<any, ResolverContext> = {
  // Nullable so a Vortex failure nulls this field rather than the query.
  type: TrendingSearchesType,
  description:
    "Artists and artworks trending on Artsy over a rolling window, ranked by " +
    "search and view activity.",
  args: {
    period: { type: TrendingSearchPeriodEnum, defaultValue: "1d" },
  },
  resolve: (_parent, { period }, context) => trendingWindowFor(period, context),
}

const SearchDropdownType = new GraphQLObjectType<void, ResolverContext>({
  name: "SearchDropdown",
  fields: () => ({
    trending: trendingSearchesField,
  }),
})

export const SearchDropdown: GraphQLFieldConfig<void, ResolverContext> = {
  type: new GraphQLNonNull(SearchDropdownType),
  resolve: () => ({}),
}

export const TrendingSearches = trendingSearchesField
