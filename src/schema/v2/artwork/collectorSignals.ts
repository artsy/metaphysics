import { GraphQLBoolean, GraphQLFieldConfig, GraphQLString } from "graphql"
import { GraphQLInt, GraphQLObjectType } from "graphql"
import { ResolverContext } from "types/graphql"
import { PartnerOfferToCollectorType } from "../partnerOfferToCollector"
import { isFeatureFlagEnabled } from "lib/featureFlags"

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
      liveAuctionBiddingStarted: {
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
}

const collectorSignalsLoader = async (
  artwork,
  ctx
): Promise<CollectorSignals> => {
  let bidCount, lotWatcherCount, partnerOffer, registrationEndsAt

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

    if (activeLotData) {
      const { saleArtwork, sale } = activeLotData
      if (artwork.recent_saves_count) {
        lotWatcherCount = artwork.recent_saves_count
      }
      if (saleArtwork.bidder_positions_count) {
        bidCount = saleArtwork.bidder_positions_count
      }
      if (sale.registration_ends_at) {
        registrationEndsAt = sale.registration_ends_at
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
    bidCount,
    lotWatcherCount,
    partnerOffer,
    registrationEndsAt,
  }
}

interface ActiveLotData {
  saleArtwork: {
    bidder_positions_count: number
  }
  sale: {
    registration_ends_at: string
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
