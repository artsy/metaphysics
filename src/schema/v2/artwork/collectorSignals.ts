import { GraphQLFieldConfig } from "graphql"
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
}

const collectorSignalsLoader = async (
  artwork,
  ctx
): Promise<CollectorSignals> => {
  let bidCount, lotWatcherCount, partnerOffer

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
    const activeSaleArtwork = await getActiveSaleArtwork(
      {
        artworkId,
        saleIds: artwork.sale_ids,
      },
      ctx
    )

    if (activeSaleArtwork) {
      if (artwork.recent_saves_count) {
        lotWatcherCount = artwork.recent_saves_count
      }
      if (activeSaleArtwork.bidder_positions_count) {
        bidCount = activeSaleArtwork.bidder_positions_count
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
  }
}

interface SaleArtwork {
  bidder_positions_count: number
}

const getActiveSaleArtwork = async (
  { artworkId, saleIds },
  ctx
): Promise<SaleArtwork | null> => {
  if (!saleIds?.length) {
    return null
  }

  const sales = await ctx.salesLoader({
    id: saleIds,
    is_auction: true,
    live: true,
  })
  const activeAuction = sales[0]

  if (!activeAuction) {
    return null
  }

  const saleArtwork =
    (await ctx.saleArtworkLoader({
      saleId: activeAuction.id,
      saleArtworkId: artworkId,
    })) ?? null

  return saleArtwork
}
