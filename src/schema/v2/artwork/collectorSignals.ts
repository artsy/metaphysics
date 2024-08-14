import { GraphQLBoolean, GraphQLFieldConfig, GraphQLString } from "graphql"
import { GraphQLInt, GraphQLObjectType } from "graphql"
import { ResolverContext } from "types/graphql"
import { PartnerOfferToCollectorType } from "../partnerOfferToCollector"
import { isFeatureFlagEnabled } from "lib/featureFlags"

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
        resolve: async (artwork, {}, ctx) => {
          const isInSale = artwork.sale_ids?.length > 0

          if (
            !checkFeatureFlag("emerald_signals-auction-improvements", ctx) ||
            !isInSale
          ) {
            return null
          }

          const activeLotData = await getActiveSaleArtwork(
            {
              artworkId: artwork.id,
              saleIds: artwork.sale_ids,
            },
            ctx
          )

          if (activeLotData) {
            return activeLotData.saleArtwork.bidder_positions_count
          }

          return null
        },
      },
      lotWatcherCount: {
        type: GraphQLInt,
        description: "Lot watcher count on lots open for bidding",
        resolve: async (artwork, {}, ctx) => {
          const isInSale = artwork.sale_ids?.length > 0

          if (
            !checkFeatureFlag("emerald_signals-auction-improvements", ctx) ||
            !isInSale
          ) {
            return null
          }

          const activeLotData = await getActiveSaleArtwork(
            {
              artworkId: artwork.id,
              saleIds: artwork.sale_ids,
            },
            ctx
          )

          if (activeLotData) {
            return artwork.recent_saves_count
          }

          return null
        },
      },
      registrationEndsAt: {
        type: GraphQLString,
        description: "Pending auction registration end time",
        resolve: async (artwork, {}, ctx) => {
          const isInSale = artwork.sale_ids?.length > 0

          if (
            !checkFeatureFlag("emerald_signals-auction-improvements", ctx) ||
            !isInSale
          ) {
            return null
          }

          const activeLotData = await getActiveSaleArtwork(
            {
              artworkId: artwork.id,
              saleIds: artwork.sale_ids,
            },
            ctx
          )

          if (activeLotData) {
            const registrationEndAtDate =
              activeLotData.sale.registration_ends_at &&
              new Date(activeLotData.sale.registration_ends_at)

            if (registrationEndAtDate && registrationEndAtDate > NOW) {
              return registrationEndAtDate.toISOString()
            }
          }

          return null
        },
      },
      lotClosesAt: {
        type: GraphQLString,
        description: "Pending auction lot end time for bidding",
        resolve: async (artwork, {}, ctx) => {
          const isInSale = artwork.sale_ids?.length > 0

          if (
            !checkFeatureFlag("emerald_signals-auction-improvements", ctx) ||
            !isInSale
          ) {
            return null
          }

          const activeLotData = await getActiveSaleArtwork(
            {
              artworkId: artwork.id,
              saleIds: artwork.sale_ids,
            },
            ctx
          )

          if (activeLotData) {
            const extendedBiddingEndAtDate =
              activeLotData.saleArtwork.extended_bidding_end_at &&
              new Date(activeLotData.saleArtwork.extended_bidding_end_at)

            if (extendedBiddingEndAtDate && extendedBiddingEndAtDate > NOW) {
              return extendedBiddingEndAtDate.toISOString()
            }

            const lotClosesAtDate =
              activeLotData.saleArtwork.end_at &&
              new Date(activeLotData.saleArtwork.end_at)

            return lotClosesAtDate && lotClosesAtDate.toISOString()
          }

          return null
        },
      },
      onlineBiddingExtended: {
        type: GraphQLBoolean,
        description:
          "Auction lot bidding period extended due to last-minute bids",
        resolve: async (artwork, {}, ctx) => {
          const isInSale = artwork.sale_ids?.length > 0

          if (
            !checkFeatureFlag("emerald_signals-auction-improvements", ctx) ||
            !isInSale
          ) {
            return null
          }

          const activeLotData = await getActiveSaleArtwork(
            {
              artworkId: artwork.id,
              saleIds: artwork.sale_ids,
            },
            ctx
          )

          if (activeLotData) {
            const extendedBiddingEndAtDate =
              activeLotData.saleArtwork.extended_bidding_end_at &&
              new Date(activeLotData.saleArtwork.extended_bidding_end_at)

            return !!(
              extendedBiddingEndAtDate && extendedBiddingEndAtDate > NOW
            )
          }

          return null
        },
      },
      liveStartAt: {
        type: GraphQLString,
        description: "Auction live bidding start time",
        resolve: async (artwork, {}, ctx) => {
          const isInSale = artwork.sale_ids?.length > 0

          if (
            !checkFeatureFlag("emerald_signals-auction-improvements", ctx) ||
            !isInSale
          ) {
            return null
          }

          const activeLotData = await getActiveSaleArtwork(
            {
              artworkId: artwork.id,
              saleIds: artwork.sale_ids,
            },
            ctx
          )

          if (activeLotData) {
            const saleLiveStartAtDate =
              activeLotData.sale.live_start_at &&
              new Date(activeLotData.sale.live_start_at)

            if (saleLiveStartAtDate) {
              if (saleLiveStartAtDate > NOW) {
                return saleLiveStartAtDate.toISOString()
              }
            }
          }

          return null
        },
      },
      liveBiddingStarted: {
        type: GraphQLBoolean,
        description: "Live bidding has started on this lot's auction",
        resolve: async (artwork, {}, ctx) => {
          const isInSale = artwork.sale_ids?.length > 0

          if (
            !checkFeatureFlag("emerald_signals-auction-improvements", ctx) ||
            !isInSale
          ) {
            return null
          }

          const activeLotData = await getActiveSaleArtwork(
            {
              artworkId: artwork.id,
              saleIds: artwork.sale_ids,
            },
            ctx
          )

          if (activeLotData) {
            const saleLiveStartAtDate =
              activeLotData.sale.live_start_at &&
              new Date(activeLotData.sale.live_start_at)

            if (saleLiveStartAtDate) {
              return saleLiveStartAtDate <= NOW
            }
          }

          return null
        },
      },
      partnerOffer: {
        type: PartnerOfferToCollectorType,
        description: "Partner offer available to collector",
        resolve: async (artwork, {}, ctx) => {
          if (
            !checkFeatureFlag("emerald_signals-partner-offers", ctx) ||
            !ctx.mePartnerOffersLoader ||
            !artwork.purchasable
          ) {
            return null
          }

          const partnerOffers = await ctx.mePartnerOffersLoader({
            artwork_id: artwork.id,
            sort: "-created_at",
            size: 1,
          })

          const activePartnerOffers = partnerOffers.body?.filter(
            (po) => po.active
          )

          return activePartnerOffers?.[0]
        },
      },
    },
  }),
  description: "Collector signals on artwork",
  resolve: (artwork) => artwork,
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

const checkFeatureFlag = (flag: any, context: any) => {
  const unleashContext = {
    userId: context.userId,
  }
  return isFeatureFlagEnabled(flag, unleashContext)
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
