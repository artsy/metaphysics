import { GraphQLBoolean, GraphQLFieldConfig, GraphQLString } from "graphql"
import { GraphQLInt, GraphQLObjectType } from "graphql"
import { ResolverContext } from "types/graphql"
import { PartnerOfferToCollectorType } from "../partnerOfferToCollector"
import { isFeatureFlagEnabled } from "lib/featureFlags"
import { some } from "lodash"
import { isFieldRequested } from "lib/isFieldRequested"

const NOW = new Date()

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
        description: "Bid count on lots open for bidding",
      },
      lotWatcherCount: {
        type: GraphQLInt,
        description: "Lot watcher count on lots open for bidding",
      },
      registrationEndsAt: {
        type: GraphQLString,
        description: "Pending auction registration end time",
      },
      lotClosesAt: {
        type: GraphQLString,
        description: "Pending auction lot end time for bidding",
      },
      onlineBiddingExtended: {
        type: GraphQLBoolean,
        description:
          "Auction lot bidding period extended due to last-minute bids",
      },
      liveStartAt: {
        type: GraphQLString,
        description: "Auction live bidding start time",
      },
      liveBiddingStarted: {
        type: GraphQLBoolean,
        description: "Live bidding has started on this lot's auction",
      },
      partnerOffer: {
        type: PartnerOfferToCollectorType,
        description: "Partner offer available to collector",
      },
    },
  }),
  description: "Collector signals on artwork",

  resolve: async (artwork, {}, ctx, resolveInfo) => {
    const collectorSignals = await collectorSignalsLoader(
      artwork,
      ctx,
      resolveInfo
    )
    return collectorSignals
  },
}

interface CollectorSignals {
  bidCount?: number
  lotWatcherCount?: number
  partnerOffer?: { endAt: string }
  registrationEndsAt?: string
  liveStartAt?: string
  liveBiddingStarted?: boolean
  onlineBiddingExtended?: boolean
  lotClosesAt?: string
}

const AUCTION_FIELDS = [
  "bidCount",
  "lotWatcherCount",
  "registrationEndsAt",
  "liveStartAt",
  "liveBiddingStarted",
  "lotClosesAt",
  "onlineBiddingExtended",
]

const collectorSignalsLoader = async (
  artwork,
  ctx,
  resolveInfo
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

  const auctionSignalsRequested =
    auctionsCollectorSignalsEnabled &&
    isInSale &&
    some(AUCTION_FIELDS, (key) => isFieldRequested(key, resolveInfo))

  const partnerOfferSignalsRequested =
    partnerOfferCollectorSignalsEnabled &&
    isFieldRequested("partnerOffer", resolveInfo)

  // Handle signals for auction artworks
  if (auctionSignalsRequested) {
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

      const registrationEndAtDate =
        sale.registration_ends_at && new Date(sale.registration_ends_at)

      if (registrationEndAtDate && registrationEndAtDate > NOW) {
        registrationEndsAt = registrationEndAtDate.toISOString()
      }

      const saleLiveStartAtDate =
        sale.live_start_at && new Date(sale.live_start_at)
      if (saleLiveStartAtDate) {
        if (saleLiveStartAtDate > NOW) {
          liveBiddingStarted = false
          liveStartAt = saleLiveStartAtDate.toISOString()
        } else {
          liveBiddingStarted = true
        }
      }

      const extendedBiddingEndAtDate =
        saleArtwork.extended_bidding_end_at &&
        new Date(saleArtwork.extended_bidding_end_at)

      if (extendedBiddingEndAtDate && extendedBiddingEndAtDate > NOW) {
        onlineBiddingExtended = true
        lotClosesAt = extendedBiddingEndAtDate.toISOString()
      } else {
        onlineBiddingExtended = false

        const lotClosesAtDate =
          saleArtwork.end_at && new Date(saleArtwork.end_at)
        lotClosesAt = lotClosesAtDate && lotClosesAtDate.toISOString()
      }
    }
  }

  // Handle signals for non-auction artworks
  if (artwork.purchasable && partnerOfferSignalsRequested) {
    if (ctx.mePartnerOffersLoader) {
      const partnerOffers = await ctx.mePartnerOffersLoader({
        artwork_id: artworkId,
        sort: "-created_at",
        size: 1,
      })

      const activePartnerOffers = partnerOffers.body?.filter((po) => po.active)

      partnerOffer = activePartnerOffers?.[0]
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
