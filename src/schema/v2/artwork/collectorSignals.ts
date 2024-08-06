import { GraphQLBoolean, GraphQLFieldConfig, GraphQLString } from "graphql"
import { GraphQLInt, GraphQLObjectType } from "graphql"
import { ResolverContext } from "types/graphql"
import { PartnerOfferToCollectorType } from "../partnerOfferToCollector"
import { isFeatureFlagEnabled } from "lib/featureFlags"

interface ActiveLotData {
  saleArtwork: {
    bidder_positions_count: number
    extended_bidding_end_at?: string
    end_at?: string
  }
  sale: {
    registration_ends_at: string
    live_start_at: string
    ended_at?: string
  }
}

export const CollectorSignals: GraphQLFieldConfig<any, ResolverContext> = {
  type: new GraphQLObjectType({
    description: "Collector signals available to the artwork",
    name: "CollectorSignals",
    fields: {
      bidCount: {
        type: GraphQLInt,
        description: "Lot bid count",
      },
      lotWatcherCount: {
        type: GraphQLInt,
        description: "Lot watcher count",
      },
      registrationEndsAt: {
        type: GraphQLString,
        description: "Auction registration end time",
      },
      lotClosesAt: {
        type: GraphQLString,
        description: "Auction lot close time",
      },
      onlineBiddingExtended: {
        type: GraphQLBoolean,
        description: "Auction bidding extension status",
      },
      liveStartAt: {
        type: GraphQLString,
        description: "Auction live bidding start time",
      },
      liveBiddingStarted: {
        type: GraphQLBoolean,
        description: "Auction live bidding status",
      },
      partnerOffer: {
        type: PartnerOfferToCollectorType,
        description: "Partner offer available to collector",
      },
    },
  }),
  description: "Collector signals on artwork",

  resolve: async (artwork, {}, ctx) => {
    const collectorSignals = await collectorSignalsLoader(artwork, ctx)
    return collectorSignals
  },
}

interface CollectorSignals {
  bidCount?: number
  lotWatcherCount?: number
  partnerOffer?: { endAt: string }
  registrationEndsAt?: string // ISO8601
  liveStartAt?: string // ISO8601
  liveBiddingStarted?: boolean
  onlineBiddingExtended?: boolean
  lotClosesAt?: string // ISO8601
}

const collectorSignalsLoader = async (
  artwork,
  ctx
): Promise<CollectorSignals> => {
  let bidCount,
    lotWatcherCount,
    partnerOffer,
    registrationEndsAt,
    liveStartAt,
    liveBiddingStarted,
    lotClosesAt,
    onlineBiddingExtended

  const artworkId = artwork.id

  const isInSale = artwork.sale_ids?.length > 0

  const unleashContext = {
    userId: ctx.userID,
  }
  const partnerOfferCollectorSignalsEnabled = isFeatureFlagEnabled(
    "emerald_signals-partner-offers",
    unleashContext
  )
  const auctionsCollectorSignalsEnabled = isFeatureFlagEnabled(
    "emerald_signals-auction-improvements",
    unleashContext
  )

  // Handle signals for auction artworks
  if (isInSale && auctionsCollectorSignalsEnabled) {
    const activeLotData = await getActiveSaleArtwork(
      {
        artworkId,
        saleIds: artwork.sale_ids,
      },
      ctx
    )

    const activeAuctionLot = activeLotData && !activeLotData.sale.ended_at
    if (activeAuctionLot) {
      const { saleArtwork, sale } = activeLotData

      if (artwork.recent_saves_count) {
        lotWatcherCount = artwork.recent_saves_count
      }

      if (saleArtwork.bidder_positions_count) {
        bidCount = saleArtwork.bidder_positions_count
      }

      const futureRegistrationEndTime = ifFutureDate(sale.registration_ends_at)
      if (futureRegistrationEndTime) {
        registrationEndsAt = futureRegistrationEndTime
      }

      const saleLiveStartAt = sale.live_start_at
      if (saleLiveStartAt) {
        const futureLiveStartTime = ifFutureDate(saleLiveStartAt)

        if (futureLiveStartTime) {
          liveBiddingStarted = false
          liveStartAt = futureLiveStartTime
        } else {
          liveBiddingStarted = true
        }
      }

      const extendedBiddingEndAt = saleArtwork.extended_bidding_end_at
      if (extendedBiddingEndAt && extendedBiddingEndAt.length > 0) {
        onlineBiddingExtended = true
        lotClosesAt = extendedBiddingEndAt
      } else {
        onlineBiddingExtended = false
        lotClosesAt = saleArtwork.end_at
      }
    }
  }

  // Handle signals for non-auction artworks
  if (artwork.purchasable && partnerOfferCollectorSignalsEnabled) {
    if (ctx.mePartnerOffersLoader) {
      const partnerOffers = await ctx.mePartnerOffersLoader({
        artwork_id: artworkId,
        sort: "-created_at",
        size: 1,
      })

      partnerOffer = partnerOffers.body[0]
    }
  }

  return {
    // auction signals
    bidCount,
    liveBiddingStarted,
    liveStartAt,
    lotClosesAt,
    lotWatcherCount,
    onlineBiddingExtended,
    registrationEndsAt,
    // purchasable signals
    partnerOffer,
  }
}

const getActiveSaleArtwork = async (
  { artworkId, saleIds },
  ctx
): Promise<ActiveLotData | null> => {
  if (!saleIds?.length) {
    return null
  }

  const sales = await ctx.salesLoader({
    id: saleIds,
    is_auction: true,
    live: true,
  })
  const activeAuction = sales?.[0]

  if (!activeAuction) {
    return null
  }

  const saleArtwork =
    (await ctx.saleArtworkLoader({
      saleId: activeAuction.id,
      saleArtworkId: artworkId,
    })) ?? null

  return { saleArtwork, sale: activeAuction }
}

const NOW = new Date()
const ifFutureDate = (date?: string): string | null => {
  if (!date) {
    return null
  }
  return new Date(date) > NOW ? date : null
}
