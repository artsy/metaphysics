import { GraphQLFieldConfig } from "graphql"
import { GraphQLInt, GraphQLObjectType } from "graphql"
import { ResolverContext } from "types/graphql"
import { PartnerOfferToCollectorType } from "../partnerOfferToCollector"

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

  // Handle signals for auction artworks
  if (inSale) {
    const activeAuctions = await activeAuctionsForArtwork(artwork, ctx)
    const activeAuction = activeAuctions[0]

    if (activeAuction) {
      const saleArtworkRequest = ctx.saleArtworkLoader({
        saleId: activeAuction.id, // _id?
        saleArtworkId: artworkId,
      })
      const [activeSaleArtwork] = await Promise.all([saleArtworkRequest])

      if (activeSaleArtwork) {
        if (artwork.recent_saves_count) {
          enrichedSignals.lotWatcherCount = artwork.recent_saves_count
        }
        if (activeSaleArtwork.bidder_positions_count) {
          enrichedSignals.bidCount = activeSaleArtwork.bidder_positions_count
        }
      }
    }

    // Handle signals for non-auction acquirable artworks
  } else if (artwork.acquireable) {
    if (ctx.mePartnerOffersLoader) {
      const partnerOffer = await ctx
        .mePartnerOffersLoader({
          artwork_id: artworkId,
          sort: "-created_at",
          size: 1,
        })
        .then(({ body }) => body[0])
      enrichedSignals.partnerOffer = partnerOffer
    }
  }
  return artwork
}

const activeAuctionsForArtwork = async (artwork, ctx) => {
  if (artwork.sale_ids?.length > 0) {
    const { salesLoader } = ctx
    const sales = await salesLoader({
      id: artwork.sale_ids,
      is_auction: true,
      live: true,
    })
    return sales
  }
  return []
}
