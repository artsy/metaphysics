import { compact, sortBy } from "lodash"
import { priceDisplayText } from "lib/moneyHelpers"

const auctionRecordsTrusted = require("lib/auction_records_trusted.json")
  .artists

// In order of importance
export const ARTIST_INSIGHT_KINDS = [
  "HIGH_AUCTION_RECORD",
  "ACTIVE_SECONDARY_MARKET",
  "CRITICALLY_ACCLAIMED",
  // "RECENT_CAREER_EVENT", // Missing
  "ARTSY_VANGUARD_YEAR",
  // "CURATORS_PICK_EMERGING", // Missing
  // "TRENDING_NOW", // Missing
  // "GAINING_FOLLOWERS", // Missing
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
    getDescription: (artist: any) => string | null
    getEntities: (artist: any) => string[]
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
    getDescription: () => "Recent auction results in the Artsy Price Database.",
    getEntities: (artist) => artist.active_secondary_market && [],
    getLabel: () => "Active Secondary Market",
  },
  HIGH_AUCTION_RECORD: {
    getDescription: (artist) => artist.highAuctionRecord,
    getEntities: (artist) => artist.highAuctionRecord && [],
    getLabel: () => "High Auction Record",
  },
  ARTSY_VANGUARD_YEAR: {
    getDescription: () =>
      "Featured in Artsy’s annual list of the most promising artists working today.",
    getEntities: (artist) => artist.vanguard_year && [],
    getLabel: (artist) => `The Artsy Vanguard ${artist.vanguard_year}`,
  },
  CRITICALLY_ACCLAIMED: {
    getDescription: () => "Recognized by major institutions and publications.",
    getEntities: (artist) => artist.critically_acclaimed && [],
    getLabel: () => "Critically Acclaimed",
  },
  RESIDENCIES: {
    getDescription: () => "Established artist residencies.",
    getEntities: (artist) => splitEntities(artist.residencies),
    getLabel: (_artist, count: number) =>
      `Participated in ${
        count === 1
          ? "a notable artist residency"
          : `${count} notable artist residencies`
      }`,
  },
  PRIVATE_COLLECTIONS: {
    getDescription: () => "A list of collections they are part of.",
    getEntities: (artist) => splitEntities(artist.private_collections),
    getLabel: (_artist, count: number) =>
      `Collected by ${
        count === 1
          ? "a notable private collector"
          : `${count} notable private collectors`
      }`,
  },
  AWARDS: {
    getDescription: () => "Awards and prizes the artist has won.",
    getEntities: (artist) => splitEntities(artist.awards),
    getLabel: (_artist, count: number) =>
      `Winner of ${
        count === 1 ? "a top industry award" : `${count} top industry awards`
      }`,
  },
}

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
  const year = auctionLot.sale_date.split("-")[0]
  const highAuctionRecord = [price, auctionLot.organization, year].join(", ")

  return highAuctionRecord
}
