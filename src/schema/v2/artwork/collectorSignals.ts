import { GraphQLFieldConfig } from "graphql"
import { GraphQLInt, GraphQLObjectType } from "graphql"
import { ResolverContext } from "types/graphql"
import { PartnerOfferToCollectorType } from "../partnerOfferToCollector"
import { isFeatureFlagEnabled } from "lib/featureFlags"

export const collectorSignals: GraphQLFieldConfig<any, ResolverContext> = {
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
  description: "List of collector signals",

  resolve: async (artwork, {}, _ctx) => {
    return artwork.collectorSignals
  },
}

interface EnrichedSignals {
  bidCount?: number
  lotWatcherCount?: number
  partnerOffer?: { endAt: string }
}

export const enrichArtworkWithCollectorSignals = async (artwork, ctx) => {
  const enrichedSignals: EnrichedSignals = {}
  artwork.collectorSignals = enrichedSignals

  const artworkId = artwork._id

  const inSale = artwork.sale_ids?.length > 0

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
  if (inSale && auctionsCollectorSignalsEnabled) {
    const activeSaleArtwork = await getActiveSaleArtwork(
      {
        artworkId,
        saleIds: artwork.sale_ids,
      },
      ctx
    )

    if (activeSaleArtwork) {
      if (artwork.recent_saves_count) {
        enrichedSignals.lotWatcherCount = artwork.recent_saves_count
      }
      if (activeSaleArtwork.bidder_positions_count) {
        enrichedSignals.bidCount = activeSaleArtwork.bidder_positions_count
      }
    }
    return artwork
  }

  // Handle signals for non-auction artworks
  if (artwork.purchasable && partnerOfferCollectorSignalsEnabled) {
    if (ctx.mePartnerOffersLoader) {
      const partnerOffers = await ctx.mePartnerOffersLoader({
        artwork_id: artworkId,
        sort: "-created_at",
        size: 1,
      })

      const partnerOffer = partnerOffers.body[0]

      enrichedSignals.partnerOffer = partnerOffer
    }
  }
  return artwork
}

const getActiveSaleArtwork = async ({ artworkId, saleIds }, ctx) => {
  if (saleIds?.length > 0) {
    const { salesLoader } = ctx
    const sales = await salesLoader({
      id: saleIds,
      is_auction: true,
      live: true,
    })

    const activeAuction = sales[0]
    if (!activeAuction) {
      return null
    }

    if (activeAuction) {
      const saleArtwork = await ctx.saleArtworkLoader({
        saleId: activeAuction.id,
        saleArtworkId: artworkId,
      })

      return saleArtwork
    }
  }
  return null
}
