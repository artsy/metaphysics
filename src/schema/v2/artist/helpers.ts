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
    description: null,
    getEntities: (artist) => splitEntities(artist.solo_show_institutions),
    label: "Solo show at a major institution",
  },
  GROUP_SHOW: {
    description: null,
    getEntities: (artist) => splitEntities(artist.group_show_institutions),
    label: "Group show at a major institution",
  },
  COLLECTED: {
    description: null,
    getEntities: (artist) => splitEntities(artist.collections, "\n"),
    label: "Collected by a major institution",
  },
  REVIEWED: {
    description: null,
    getEntities: (artist) => splitEntities(artist.review_sources),
    label: "Reviewed by a major art publication",
  },
  BIENNIAL: {
    description: null,
    getEntities: (artist) => splitEntities(artist.biennials),
    label: "Included in a major biennial",
  },
  ACTIVE_SECONDARY_MARKET: {
    description: "Recent auction results in the Artsy Price Database",
    getEntities: (artist) => artist.active_secondary_market && [],
    label: "Active Secondary Market",
  },
} as const

const splitEntities = (value, delimiter = "|") => {
  if (!value) return null

  const entities = value
    .trim()
    .split(delimiter)
    .map((entity) => entity.trim())

  return entities
}

export const getArtistInsights = (artist) => {
  const mappings = Object.entries(ARTIST_INSIGHT_MAPPING) as [
    ArtistInsightKind,
    typeof ARTIST_INSIGHT_MAPPING[ArtistInsightKind]
  ][]

  const insights = mappings.map((mapping) => {
    const [kind, { description, getEntities, label }] = mapping

    const entities = getEntities(artist)
    if (!entities) return { artist }

    return {
      artist,
      count: entities.length,
      description,
      entities,
      kind,
      label,
      type: kind,
    }
  })

  return compact(insights)
}
