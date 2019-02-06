import { compact } from "lodash"

import {
  GraphQLObjectType,
  GraphQLList,
  GraphQLEnumType,
  GraphQLString,
} from "graphql"

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
      value: "Participated in a major biennial",
    },
  },
})

const ArtistInsightTypeMapping = {
  solo_show_institutions: { type: ArtistInsightType.getValue("SOLO_SHOW") },
  group_show_institutions: { type: ArtistInsightType.getValue("GROUP_SHOW") },
  collections: {
    type: ArtistInsightType.getValue("COLLECTED"),
    delimiter: "\n",
  },
  review_sources: { type: ArtistInsightType.getValue("REVIEWED") },
  biennials: { type: ArtistInsightType.getValue("BIENNIAL") },
}

const buildInsights = artist => {
  const splitEntities = (entitiesString: String, delimiter): Array<String> => {
    return entitiesString.split(delimiter).map(entity => {
      return entity.trim()
    })
  }

  const buildInsight = (mapping, entitiesString: String) => {
    return {
      type: mapping.type.name,
      entities: splitEntities(entitiesString, mapping.delimiter || "|"),
      label: mapping.type.value,
    }
  }

  return compact(
    Object.keys(ArtistInsightTypeMapping).map(key => {
      const entitiesString = artist[key] && artist[key].trim()

      if (entitiesString) {
        return buildInsight(ArtistInsightTypeMapping[key], entitiesString)
      }
    })
  )
}

const ArtistInsight = new GraphQLObjectType<ResolverContext>({
  name: "ArtistInsight",
  fields: {
    type: {
      type: GraphQLString,
      description: "The type of insight.",
    },
    label: {
      type: GraphQLString,
      description: "Label to use when displaying the insight.",
    },
    entities: {
      type: new GraphQLList(GraphQLString),
      description: "List of entities relevant to the insight.",
    },
  },
})

export const ArtistInsights = {
  type: new GraphQLList(ArtistInsight),
  resolve: artist => {
    return buildInsights(artist)
  },
}
