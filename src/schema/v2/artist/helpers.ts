import { compact } from "lodash"

export const ARTIST_INSIGHT_KINDS = {
  SOLO_SHOW: { value: "SOLO_SHOW" },
  GROUP_SHOW: { value: "GROUP_SHOW" },
  COLLECTED: { value: "COLLECTED" },
  REVIEWED: { value: "REVIEWED" },
  BIENNIAL: { value: "BIENNIAL" },
  ACTIVE_SECONDARY_MARKET: { value: "ACTIVE_SECONDARY_MARKET" },
} as const

type ArtistInsightKind = keyof typeof ARTIST_INSIGHT_KINDS

export const ARTIST_INSIGHT_MAPPING = {
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

export const getArtistInsights = (artist) => {
  const insights = (Object.entries(ARTIST_INSIGHT_MAPPING) as [
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
    }
  })

  return compact(insights)
}
