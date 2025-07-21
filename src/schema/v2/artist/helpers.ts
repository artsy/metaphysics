import { compact, sortBy } from "lodash"
import { priceDisplayText } from "lib/moneyHelpers"
import camelCase from "lodash/camelCase"
const auctionRecordsTrusted = require("lib/auction_records_trusted.json")
  .artists

const FOLLOWER_GROWTH_MIN_VALUE = 20

// In order of importance
export const ARTIST_INSIGHT_KINDS = [
  "HIGH_AUCTION_RECORD",
  "ACTIVE_SECONDARY_MARKET",
  "CRITICALLY_ACCLAIMED",
  "RECENT_CAREER_EVENT",
  "ARTSY_VANGUARD_YEAR",
  "CURATORS_PICK_EMERGING",
  "TRENDING_NOW",
  "GAINING_FOLLOWERS",
  "SOLO_SHOW",
  "GROUP_SHOW",
  "BIENNIAL",
  "PRIVATE_COLLECTIONS",
  "COLLECTED",
  "REVIEWED",
  "AWARDS", // Not ranked
  "RESIDENCIES", // Not ranked
  "FOUNDATIONS",
] as const

type ArtistInsightKind = typeof ARTIST_INSIGHT_KINDS[number]

export const ARTIST_INSIGHT_MAPPING: Record<
  ArtistInsightKind,
  {
    // FIXME: There should be a function that determines visibility.
    // Currently it uses `getEntities` but not empty array but an existential check.
    getDescription: (artist: any) => string | null
    getEntities: (artist: any) => string[] | null
    getLabel: (artist: any, count: number) => string
  }
> = {
  SOLO_SHOW: {
    getDescription: () => null,
    getEntities: (artist) => artist.soloShowInstitutions,
    getLabel: (_artist, count: number) =>
      `Solo show at ${
        count === 1 ? "a major institution" : `${count} major institutions`
      }`,
  },
  GROUP_SHOW: {
    getDescription: () => null,
    getEntities: (artist) => artist.groupShowInstitutions,
    getLabel: (_artist, count: number) =>
      `Group show at ${
        count === 1 ? "a major institution" : `${count} major institutions`
      }`,
  },
  COLLECTED: {
    getDescription: () => null,
    getEntities: (artist) => artist.collectedInstitutions,
    getLabel: (_artist, count: number) =>
      `Collected by ${
        count === 1 ? "a major institution" : `${count} major institutions`
      }`,
  },
  REVIEWED: {
    getDescription: () => null,
    getEntities: (artist) => splitEntities(artist.review_sources),
    getLabel: (_artist, count: number) =>
      `Reviewed by ${
        count === 1
          ? "a major art publication"
          : `${count} major art publications`
      }`,
  },
  BIENNIAL: {
    getDescription: () => null,
    getEntities: (artist) => splitEntities(artist.biennials),
    getLabel: (_artist, count: number) =>
      `Included in ${
        count === 1 ? "a major biennial" : `${count} major biennials`
      }`,
  },
  ACTIVE_SECONDARY_MARKET: {
    getDescription: (artist) =>
      `Recent auction results in the [Artsy Price Database](/artist/${artist.id}/auction-results)`,
    getEntities: (artist) => artist.active_secondary_market && [],
    getLabel: () => "Active secondary market",
  },
  HIGH_AUCTION_RECORD: {
    getDescription: (artist) =>
      artist.highAuctionRecord &&
      `[${[
        artist.highAuctionRecord.organization,
        artist.highAuctionRecord.year,
      ].join(", ")}](${artist.highAuctionRecord.url})`,
    getEntities: (artist) => artist.highAuctionRecord && [],
    getLabel: (artist) => {
      return artist.highAuctionRecord
        ? `High auction record (${artist.highAuctionRecord.price})`
        : "High auction record"
    },
  },
  ARTSY_VANGUARD_YEAR: {
    getDescription: () =>
      `Featured in Artsy’s [annual list](/collection/artsy-vanguard-artists) of the most promising artists working today`,
    getEntities: (artist) => artist.vanguard_year && [],
    getLabel: (artist) => `The Artsy Vanguard ${artist.vanguard_year}`,
  },
  GAINING_FOLLOWERS: {
    getDescription: (artist) =>
      `${artist.follower_growth}% increase in Artsy followers compared to same time last year.`,
    getEntities: (artist) =>
      artist.follower_growth >= FOLLOWER_GROWTH_MIN_VALUE ? [] : null,
    getLabel: () => `Gaining Followers`,
  },
  CRITICALLY_ACCLAIMED: {
    getDescription: () => "Recognized by major institutions and publications",
    getEntities: (artist) => artist.critically_acclaimed && [],
    getLabel: () => "Critically acclaimed",
  },
  TRENDING_NOW: {
    getDescription: () =>
      `[Works by this artist](/collection/trending-now) are among the most searched, viewed, and asked-about pieces on Artsy.`,
    getEntities: (artist) => artist.curated_trending_weekly && [],
    getLabel: () => "Featured in Trending Now",
  },
  CURATORS_PICK_EMERGING: {
    getDescription: () =>
      `Works by this artist were handpicked for [this collection](/collection/curators-picks-emerging) of rising talents to watch.`,
    getEntities: (artist) => artist.curated_emerging && [],
    getLabel: () => "Featured in Curators’ Picks: Emerging",
  },
  RECENT_CAREER_EVENT: {
    getDescription: (artist) => artist.recent_show && getRecentShow(artist),
    getEntities: (artist) => artist.recent_show && getRecentShow(artist) && [],
    getLabel: () => "Recent career event",
  },
  RESIDENCIES: {
    getDescription: () => null,
    getEntities: (artist) => splitEntities(artist.residencies),
    getLabel: (_artist, count: number) =>
      `Participated in ${
        count === 1
          ? "a notable artist residency"
          : `${count} notable artist residencies`
      }`,
  },
  PRIVATE_COLLECTIONS: {
    getDescription: () => null,
    getEntities: (artist) => splitEntities(artist.private_collections),
    getLabel: (_artist, count: number) =>
      `Collected by ${
        count === 1
          ? "a notable private collector"
          : `${count} notable private collectors`
      }`,
  },
  AWARDS: {
    getDescription: () => null,
    getEntities: (artist) => splitEntities(artist.awards),
    getLabel: (_artist, count: number) =>
      `Winner of ${
        count === 1 ? "a top industry award" : `${count} top industry awards`
      }`,
  },
  FOUNDATIONS: {
    getDescription: (artist) =>
      formatFoundationsDescription(artist.foundations),
    getEntities: (artist) => splitEntities(artist.foundations) && [],
    getLabel: (artist) => formatFoundationsLabel(artist.foundations),
  },
}

const splitEntities = (
  value: string | null,
  delimiter = "|"
): string[] | null => {
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
    const [kind, { getDescription, getEntities, getLabel }] = mapping

    const entities = getEntities(artist)
    if (!entities) return { artist }

    const description = getDescription(artist)
    const label = getLabel(artist, entities.length)

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

  return sortBy(compact(insights), ({ kind }) => {
    if (!kind) return
    return ARTIST_INSIGHT_KINDS.indexOf(kind)
  })
}

export const getAuctionRecord = async (artist, auctionLotsLoader) => {
  if (!auctionRecordsTrusted.includes(artist._id)) return null

  const response = await auctionLotsLoader({
    artist_id: artist._id,
    size: 1,
    sort: "-price_realized_cents_usd,-sale_date",
  })

  const auctionLot = response._embedded.items[0]

  if (!auctionLot) return null

  const { currency, price_realized_cents } = auctionLot
  const price = priceDisplayText(price_realized_cents, currency, "0.0a")
  const [year] = auctionLot.sale_date.split("-")
  const url = `/auction-result/${auctionLot.id}`

  return {
    price,
    organization: auctionLot.organization,
    year,
    url,
  }
}

const careerHighlightsMap = {
  solo_show: "solo",
  group_show: "group",
  collected: "collected",
}

export const enrichWithArtistCareerHighlights = async (
  kind,
  artist,
  artistCareerHighlightsLoader
) => {
  if (!artistCareerHighlightsLoader) return

  const validTypes = ["SOLO_SHOW", "GROUP_SHOW", "COLLECTED"]

  for (const type of validTypes) {
    if (kind.includes(type)) {
      const highlights = await getArtistCareerHighlights(
        artistCareerHighlightsLoader,
        artist._id,
        careerHighlightsMap[type.toLowerCase()]
      )
      // eslint-disable-next-line require-atomic-updates
      artist[`${camelCase(type)}Institutions`] = highlights
    }
  }
}

export const getArtistCareerHighlights = async (
  artistCareerHighlightsLoader,
  artist_id,
  type
) => {
  if (!artistCareerHighlightsLoader) return null

  try {
    const response = await artistCareerHighlightsLoader({
      artist_id,
      [type]: true,
    })

    if (!response) return null

    const highlights = response.map((highlight) => highlight.venue.trim())
    return highlights
  } catch (error) {
    console.error(
      `[schema/v2/artist/insights] fetching artist career highlights: ${error}`
    )
    return null
  }
}

export const getRecentShow = (artist): string | null => {
  // dd/mm/yyy|slug|Group or Solo|Show Title
  const entities = splitEntities(artist.recent_show)
  if (!entities) return null

  const date = entities[0]
  const show = entities[entities.length - 1]

  const showDate = new Date(date)
  const today = new Date()
  const threeYearsAgo = new Date()

  threeYearsAgo.setFullYear(today.getFullYear() - 3)

  if (showDate < threeYearsAgo) return null
  const year = showDate.getFullYear()
  const title = `${year} ${show}`

  return title
}

const formatFoundationsLabel = (foundationsArr) => {
  const foundations = splitEntities(foundationsArr)

  if (!foundations || foundations.length === 0) {
    return "Foundations"
  }

  const allButLast = foundations.slice(0, -1).join(", ")
  const lastItem = foundations[foundations.length - 1]

  return `Foundations ${
    allButLast ? `${allButLast} and ${lastItem}` : lastItem
  }`
}

const formatFoundationsDescription = (foundationsArr) => {
  if (!foundationsArr || !foundationsArr.length) return null

  const foundations = splitEntities(foundationsArr) || []

  const foundationsUrls = {
    "Summer 2023": "/fair/foundations",
    "Winter 2024": "/fair/foundations-winter-2024",
    "Summer 2024": "/fair/foundations-summer-2024",
    "Summer 2025": "/fair/foundations-2025",
  }

  const lastFoundation = foundations[foundations.length - 1]
  const lastFoundationUrl = foundationsUrls[lastFoundation]

  return `Featured in [Foundations](${lastFoundationUrl}), the online fair for emerging art, curated by Artsy.`
}
