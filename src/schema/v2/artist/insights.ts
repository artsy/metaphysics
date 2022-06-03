import { compact } from "lodash"
import {
  GraphQLObjectType,
  GraphQLList,
  GraphQLEnumType,
  GraphQLString,
  GraphQLFieldConfig,
  GraphQLNonNull,
} from "graphql"
import { ResolverContext } from "types/graphql"

export const ArtistInsightType = new GraphQLEnumType({
  name: "ArtistInsightType",
  values: {
    SOLO_SHOW: {
      value: "Solo show at a major institution",
    },
    GROUP_SHOW: {
      value: "Group show at a major institution",
    },
    COLLECTED: {
      value: "Collected by a major institution",
    },
    REVIEWED: {
      value: "Reviewed by a major art publication",
    },
    BIENNIAL: {
      value: "Included in a major biennial",
    },
    ACTIVE_SECONDARY_MARKET: {
      value: "Recent auction results in the Artsy Price Database",
    },
  },
})

const ARTIST_INSIGHT_TYPES = {
  solo_show_institutions: { type: ArtistInsightType.getValue("SOLO_SHOW") },
  group_show_institutions: { type: ArtistInsightType.getValue("GROUP_SHOW") },
  collections: {
    type: ArtistInsightType.getValue("COLLECTED"),
    delimiter: "\n",
  },
  review_sources: { type: ArtistInsightType.getValue("REVIEWED") },
  biennials: { type: ArtistInsightType.getValue("BIENNIAL") },
  active_secondary_market: {
    type: ArtistInsightType.getValue("ACTIVE_SECONDARY_MARKET"),
  },
}

const buildInsights = (artist) => {
  const splitEntities = (
    entitiesString: string,
    delimiter: string
  ): Array<string> => {
    return entitiesString.split(delimiter).map((entity) => {
      return entity.trim()
    })
  }

  return compact(
    Object.keys(ARTIST_INSIGHT_TYPES).map((key) => {
      const value = artist[key]

      if (!value) {
        return
      }

      const mapping = ARTIST_INSIGHT_TYPES[key]

      switch (typeof value) {
        case "string":
          const trimmed = value.trim()

          if (!trimmed) return null

          return {
            entities: splitEntities(trimmed, mapping.delimiter || "|"),
            label: mapping.type.value,
            type: mapping.type.name,
          }

        case "boolean":
          return {
            entities: [],
            label: mapping.type.value,
            type: mapping.type.name,
          }

        default:
          return null
      }
    })
  )
}

const ArtistInsight = new GraphQLObjectType<any, ResolverContext>({
  name: "ArtistInsight",
  fields: {
    type: {
      type: new GraphQLNonNull(GraphQLString),
      description: "The type of insight.",
    },
    label: {
      type: new GraphQLNonNull(GraphQLString),
      description: "Label to use when displaying the insight.",
    },
    entities: {
      type: new GraphQLNonNull(GraphQLList(new GraphQLNonNull(GraphQLString))),
      description: "List of entities relevant to the insight.",
    },
  },
})

export const ArtistInsights: GraphQLFieldConfig<any, ResolverContext> = {
  type: new GraphQLList(ArtistInsight),
  resolve: (artist) => {
    return buildInsights(artist)
  },
}
