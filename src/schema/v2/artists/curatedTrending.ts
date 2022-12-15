import { GraphQLFieldConfig } from "graphql"
import type { ResolverContext } from "types/graphql"
import { connectionArgs, connectionFromArray } from "graphql-relay"
import Artist from "schema/v2/artist"
import { dailyShuffle } from "lib/shuffle"
import { ArtworksAggregation } from "../aggregations/filter_artworks_aggregation"
import { artistConnection } from "../artist"

export const getCuratedArtists = async (context): Promise<[typeof Artist]> => {
  const { artistsLoader, filterArtworksLoader, defaultTimezone } = context
  const artworks = await filterArtworksLoader({
    size: 0,
    marketing_collection_id: "trending-this-week",
    aggregations: [
      ArtworksAggregation.getValue("MERCHANDISABLE_ARTISTS")!.value,
    ],
  })

  const artists = artworks.aggregations.merchandisable_artists
  const artistIDs = Object.keys(artists)
  const shuffledIDs = dailyShuffle(artistIDs, defaultTimezone)
  const { body: artistRecords } = await artistsLoader({
    ids: shuffledIDs,
  })

  return artistRecords
}

export const CuratedTrendingArtists: GraphQLFieldConfig<
  void,
  ResolverContext
> = {
  type: artistConnection.connectionType,
  description:
    "A list of trending artists. Inferred from a manually curated collection of trending artworks.",
  args: connectionArgs,
  resolve: async (_parent, args, context) => {
    const artistRecords = await getCuratedArtists(context)
    return connectionFromArray(artistRecords, args)
  },
}
