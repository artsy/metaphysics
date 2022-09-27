import { compact } from "lodash"
import { priceDisplayText } from "lib/moneyHelpers"

const auctionRecordsTrusted = require("lib/auction_records_trusted.json")
  .artists

export const ARTIST_INSIGHT_KINDS = {
  SOLO_SHOW: { value: "SOLO_SHOW" },
  GROUP_SHOW: { value: "GROUP_SHOW" },
  COLLECTED: { value: "COLLECTED" },
  REVIEWED: { value: "REVIEWED" },
  BIENNIAL: { value: "BIENNIAL" },
  ACTIVE_SECONDARY_MARKET: { value: "ACTIVE_SECONDARY_MARKET" },
  HIGH_AUCTION_RECORD: { value: "HIGH_AUCTION_RECORD" },
} as const

type ArtistInsightKind = keyof typeof ARTIST_INSIGHT_KINDS

export const ARTIST_INSIGHT_MAPPING = {
  SOLO_SHOW: {
    getDescription: () => null,
    getEntities: (artist) => splitEntities(artist.solo_show_institutions),
    label: "Solo show at a major institution",
  },
  GROUP_SHOW: {
    getDescription: () => null,
    getEntities: (artist) => splitEntities(artist.group_show_institutions),
    label: "Group show at a major institution",
  },
  COLLECTED: {
    getDescription: () => null,
    getEntities: (artist) => splitEntities(artist.collections, "\n"),
    label: "Collected by a major institution",
  },
  REVIEWED: {
    getDescription: () => null,
    getEntities: (artist) => splitEntities(artist.review_sources),
    label: "Reviewed by a major art publication",
  },
  BIENNIAL: {
    getDescription: () => null,
    getEntities: (artist) => splitEntities(artist.biennials),
    label: "Included in a major biennial",
  },
  ACTIVE_SECONDARY_MARKET: {
    getDescription: () => "Recent auction results in the Artsy Price Database",
    getEntities: (artist) => artist.active_secondary_market && [],
    label: "Active Secondary Market",
  },
  HIGH_AUCTION_RECORD: {
    getDescription: (artist) => artist.highAuctionRecord,
    getEntities: (artist) => artist.highAuctionRecord && [],
    label: "High Auction Record",
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
    const [kind, { getDescription, getEntities, label }] = mapping

    const entities = getEntities(artist)
    if (!entities) return { artist }

    const description = getDescription(artist)

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

export const getAuctionRecord = async (artist, auctionLotsLoader) => {
  if (!auctionRecordsTrusted.includes(artist._id)) return null

  const response = await auctionLotsLoader({
    artist_id: artist._id,
    size: 1,
    sort: "-price_realized_cents_usd,-sale_date",
  })

  const auctionLot = response._embedded.items[0]
  const { currency, price_realized_cents } = auctionLot
  const price = priceDisplayText(price_realized_cents, currency, "0.0a")
  const year = auctionLot.sale_date.split("-")[0]
  const highAuctionRecord = [price, auctionLot.organization, year].join(", ")

  return highAuctionRecord
}
