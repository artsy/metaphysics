import { isFeatureFlagEnabled } from "lib/featureFlags"

interface EnrichedSignals {
  bidCount?: number
  lotWatcherCount?: number
  partnerOffer?: { endAt: string }
}

// Fetch data for an artwork to fulfill the CollectorSignals resolver
export const fetchCollectorSignals = async (
  artwork,
  ctx
): Promise<EnrichedSignals> => {
  let bidCount, lotWatcherCount, partnerOffer

  const artworkId = artwork._id

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
      try {
        const partnerOffers = await ctx.mePartnerOffersLoader({
          artwork_id: artworkId,
          sort: "-created_at",
          size: 1,
        })

        partnerOffer = partnerOffers.body[0]
      } catch (error) {
        console.error(
          "fetchCollectorSignals: Error fetching partner offers",
          error
        )
      }
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

  let activeAuction
  try {
    const sales = await ctx.salesLoader({
      id: saleIds,
      is_auction: true,
      live: true,
    })
    activeAuction = sales[0]
  } catch (error) {
    console.error("fetchCollectorSignals: Error fetching active auction", error)
  }

  if (!activeAuction) {
    return null
  }

  let saleArtwork = null
  try {
    saleArtwork =
      (await ctx.saleArtworkLoader({
        saleId: activeAuction.id,
        saleArtworkId: artworkId,
      })) ?? null
  } catch (error) {
    console.error("fetchCollectorSignals: Error fetching sale artwork", error)
  }
  return saleArtwork
}
