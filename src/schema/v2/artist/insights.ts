import {
  GraphQLEnumType,
  GraphQLFieldConfig,
  GraphQLInt,
  GraphQLList,
  GraphQLNonNull,
  GraphQLObjectType,
  GraphQLString,
} from "graphql"
import { ResolverContext } from "types/graphql"
import { ArtistType } from "../artist"
import {
  ARTIST_INSIGHT_KINDS,
  getArtistInsights,
  getAuctionRecord,
} from "./helpers"

export const ArtistInsightKind = new GraphQLEnumType({
  name: "ArtistInsightKind",
  values: ARTIST_INSIGHT_KINDS,
})

export const ArtistInsight = new GraphQLObjectType<any, ResolverContext>({
  name: "ArtistInsight",
  fields: () => ({
    type: {
      type: new GraphQLNonNull(GraphQLString),
      description: "The type of insight.",
      deprecationReason: "Use `kind` instead.",
    },
    label: {
      type: new GraphQLNonNull(GraphQLString),
      description: "Label to use when displaying the insight.",
    },
    description: {
      type: GraphQLString,
    },
    entities: {
      type: new GraphQLNonNull(GraphQLList(new GraphQLNonNull(GraphQLString))),
      description: "List of entities relevant to the insight.",
    },
    count: {
      type: new GraphQLNonNull(GraphQLInt),
      description: "Number of entities relevant to the insight.",
    },
    kind: {
      type: ArtistInsightKind,
      description: "The type of insight.",
    },
    artist: {
      type: ArtistType,
    },
  }),
})

// TODO:
// return partnerArtistsLoader({ artist_id: artist.id, partner_category: ['blue-chip'], size: 1})

export const ArtistInsights: GraphQLFieldConfig<any, ResolverContext> = {
  type: new GraphQLNonNull(new GraphQLList(new GraphQLNonNull(ArtistInsight))),
  args: {
    kind: {
      type: new GraphQLList(ArtistInsightKind),
      description: "The specific insights to return.",
      defaultValue: Object.keys(ARTIST_INSIGHT_KINDS),
    },
  },
  resolve: async (artist, { kind }, { auctionLotsLoader }) => {
    if (kind.includes("HIGH_AUCTION_RECORD")) {
      const highAuctionRecord = await getAuctionRecord(
        artist,
        auctionLotsLoader
      )
      artist.highAuctionRecord = highAuctionRecord
    }

    const insights = getArtistInsights(artist)

    return insights.filter((insight) => kind.includes(insight.type))
  },
}
