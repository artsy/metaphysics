import {
  GraphQLEnumType,
  GraphQLFieldConfig,
  GraphQLInt,
  GraphQLList,
  GraphQLNonNull,
  GraphQLObjectType,
  GraphQLString,
} from "graphql"
import { compact } from "lodash"
import { ResolverContext } from "types/graphql"
import { ArtistType } from "../artist"

const ARTIST_INSIGHT_KINDS = {
  SOLO_SHOW: { value: "SOLO_SHOW" },
  GROUP_SHOW: { value: "GROUP_SHOW" },
  COLLECTED: { value: "COLLECTED" },
  REVIEWED: { value: "REVIEWED" },
  BIENNIAL: { value: "BIENNIAL" },
  ACTIVE_SECONDARY_MARKET: { value: "ACTIVE_SECONDARY_MARKET" },
} as const

type ArtistInsightKind = keyof typeof ARTIST_INSIGHT_KINDS

const ARTIST_INSIGHT_MAPPING = {
  SOLO_SHOW: {
    label: "Solo show at a major institution",
    description: null,
    fieldName: "solo_show_institutions",
    delimiter: "|",
  },
  GROUP_SHOW: {
    label: "Group show at a major institution",
    description: null,
    fieldName: "group_show_institutions",
    delimiter: "|",
  },
  COLLECTED: {
    label: "Collected by a major institution",
    description: null,
    fieldName: "collections",
    delimiter: "\n",
  },
  REVIEWED: {
    label: "Reviewed by a major art publication",
    description: null,
    fieldName: "review_sources",
    delimiter: "|",
  },
  BIENNIAL: {
    label: "Included in a major biennial",
    description: null,
    fieldName: "biennials",
    delimiter: "|",
  },
  ACTIVE_SECONDARY_MARKET: {
    label: "Active Secondary Market",
    description: "Recent auction results in the Artsy Price Database",
    fieldName: "active_secondary_market",
    delimiter: null,
  },
} as const

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
  resolve: (artist, { kind }) => {
    const insights = getArtistInsights(artist)

    return insights.filter((insight) => kind.includes(insight.type))
  },
}

export const getArtistInsights = (artist) =>
  compact(
    (Object.entries(ARTIST_INSIGHT_MAPPING) as [
      ArtistInsightKind,
      typeof ARTIST_INSIGHT_MAPPING[ArtistInsightKind]
    ][]).map(([kind, { label, description, fieldName, delimiter }]) => {
      const value = artist[fieldName]

      if (!value) {
        return { artist }
      }

      switch (typeof value) {
        case "string":
          const trimmed = value.trim()

          if (!trimmed) return null

          const entities = trimmed
            .split(delimiter ?? "|")
            .map((entity) => entity.trim())
          return {
            entities,
            count: entities.length,
            label,
            type: kind,
            kind,
            description,
            artist,
          }

        case "boolean":
          return {
            entities: [],
            label,
            type: kind,
            kind,
            description,
            count: value ? 1 : 0,
            artist,
          }

        default:
          return { count: 0, artist }
      }
    })
  )
