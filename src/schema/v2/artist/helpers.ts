import { compact, sortBy } from "lodash"
import { priceDisplayText } from "lib/moneyHelpers"

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
    getEntities: (artist) => splitEntities(artist.solo_show_institutions),
    getLabel: (_artist, count: number) =>
      `Solo show at ${
        count === 1 ? "a major institution" : `${count} major institutions`
      }`,
  },
  GROUP_SHOW: {
    getDescription: () => null,
    getEntities: (artist) => splitEntities(artist.group_show_institutions),
    getLabel: (_artist, count: number) =>
      `Group show at ${
        count === 1 ? "a major institution" : `${count} major institutions`
      }`,
  },
  COLLECTED: {
    getDescription: () => null,
    getEntities: (artist) => splitEntities(artist.collections),
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
    getDescription: () => "Recent auction results in the Artsy Price Database",
    getEntities: (artist) => artist.active_secondary_market && [],
    getLabel: () => "Active secondary market",
  },
  HIGH_AUCTION_RECORD: {
    getDescription: (artist) =>
      artist.highAuctionRecord &&
      `${[
        artist.highAuctionRecord.organization,
        artist.highAuctionRecord.year,
      ].join(", ")}`,
    getEntities: (artist) => artist.highAuctionRecord && [],
    getLabel: (artist) => {
      return artist.highAuctionRecord
        ? `High auction record (${artist.highAuctionRecord.price})`
        : "High auction record"
    },
  },
  ARTSY_VANGUARD_YEAR: {
    getDescription: () =>
      "Featured in Artsy’s annual list of the most promising artists working today",
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
      "Works by this artist are among the most searched, viewed, and asked-about pieces on Artsy.",
    getEntities: (artist) => artist.curated_trending_weekly && [],
    getLabel: () => "Featured in Trending Now",
  },
  CURATORS_PICK_EMERGING: {
    getDescription: () =>
      "Works by this artist were handpicked for this collection of rising talents to watch.",
    getEntities: (artist) => artist.curated_emerging && [],
    getLabel: () => "Featured in Curator’s Pick: Emerging",
  },
  RECENT_CAREER_EVENT: {
    getDescription: (artist) => artist.recent_show && getRecentShow(artist),
    getEntities: (artist) => artist.recent_show && getRecentShow(artist) && [],
    getLabel: () => "Recent career event",
  },
  RESIDENCIES: {
    getDescription: () => "Established artist residencies",
    getEntities: (artist) => splitEntities(artist.residencies),
    getLabel: (_artist, count: number) =>
      `Participated in ${
        count === 1
          ? "a notable artist residency"
          : `${count} notable artist residencies`
      }`,
  },
  PRIVATE_COLLECTIONS: {
    getDescription: () => "A list of collections they are part of",
    getEntities: (artist) => splitEntities(artist.private_collections),
    getLabel: (_artist, count: number) =>
      `Collected by ${
        count === 1
          ? "a notable private collector"
          : `${count} notable private collectors`
      }`,
  },
  AWARDS: {
    getDescription: () => "Awards and prizes the artist has won",
    getEntities: (artist) => splitEntities(artist.awards),
    getLabel: (_artist, count: number) =>
      `Winner of ${
        count === 1 ? "a top industry award" : `${count} top industry awards`
      }`,
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

  return {
    price,
    organization: auctionLot.organization,
    year,
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
