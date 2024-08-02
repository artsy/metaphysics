import { GraphQLFieldConfig, GraphQLList } from "graphql"
import { GraphQLInt, GraphQLObjectType } from "graphql"
import { ResolverContext } from "types/graphql"
import { PartnerOfferToCollectorType } from "../partnerOfferToCollector"
import { isFeatureFlagEnabled } from "lib/featureFlags"
import Show from "../show"
import {
  fetchMarketingCollections,
  MarketingCollection,
} from "../marketingCollections"

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
      activeShow: {
        type: Show.type,
        description: "Show the artwork is currently in",
      },
      curatedCollections: {
        type: new GraphQLList(MarketingCollection.type),
        description: "Curated collections the artwork is a member of",
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
  activeShow?: any
  curatedCollections?: any[]
}

const collectorSignalsLoader = async (
  artwork,
  ctx
): Promise<CollectorSignals> => {
  let bidCount, lotWatcherCount, partnerOffer, activeShow, curatedCollections

  const artworkSlug = artwork.id
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
        artworkSlug,
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
        artwork_id: artworkSlug,
        sort: "-created_at",
        size: 1,
      })

      partnerOffer = partnerOffers.body[0]
    }
  }

  // Temporary
  const experimentalCollectorSignalsEnabled = auctionsCollectorSignalsEnabled
  if (experimentalCollectorSignalsEnabled) {
    curatedCollections = await getCuratedCollections({ artworkId }, ctx)
    activeShow = await getActiveShow({ artworkId }, ctx)
  }

  return {
    bidCount,
    lotWatcherCount,
    partnerOffer,
    activeShow: activeShow ?? undefined,
    // using undefined for now to follow existing pattern
    curatedCollections: curatedCollections ?? undefined,
  }
}

interface SaleArtwork {
  bidder_positions_count: number
}

const getActiveSaleArtwork = async (
  { artworkSlug, saleIds },
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
      saleArtworkId: artworkSlug,
    })) ?? null

  return saleArtwork
}

// Get signal-enabled marketing collections the artwork is a member of

// https://github.com/artsy/metaphysics/blob/a3fbb272bfd9ca69a5ce3c4874327bc66b204a22/src/schema/v2/marketingCollections.ts#L353-L377
// does something similar for the Curated Marketing Connections Loader
const CURATED_COLLECTION_SLUGS = [
  "curators-picks-blue-chip-artists",
  "curators-picks-emerging-artists",
  "trending-now",
]
const getCuratedCollections = async (
  { artworkId },
  ctx
): Promise<string[] | null> => {
  const marketingCollections = await fetchMarketingCollections(
    {
      slugs: CURATED_COLLECTION_SLUGS,
      size: CURATED_COLLECTION_SLUGS.length,
      page: 1,
    },
    ctx.marketingCollectionsLoader
  )
  const collectionsForArtwork = (marketingCollections as Array<{
    slug: string
    artwork_ids: string[]
  }>).reduce<any[]>((acc, marketingCollection) => {
    console.log(marketingCollection)
    if (marketingCollection?.artwork_ids?.includes(artworkId)) {
      acc.push(marketingCollection)
    }
    return acc
  }, [] as any[])

  return collectionsForArtwork.length ? collectionsForArtwork : null
}

const getActiveShow = async ({ artworkId }, ctx): Promise<string[] | null> => {
  const shows = await await ctx.relatedShowsLoader({
    artwork: [artworkId],
    size: 1,
    // status: "running_and_upcoming", // requires api/v1/related/shows update
    status: "running", // could also include "upcoming" but i think that is another query
    // active: true, // need to investigate what active means here - part of FilteredSearch
    // maybe it is the same as status: "running" + 'upcoming
  })

  // TODO: Do we need to check fairs as well?
  return shows.body[0]
}

// // get related shows (does not include upcoming shows)
// const relatedShows = await ctx.relatedShowsLoader({
//   artwork: [artworkId],
//   size: 1,
//   active: true,
// })
// const activeShow = relatedShows.body[0] ?? null
