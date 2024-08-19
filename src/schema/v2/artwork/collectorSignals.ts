import { GraphQLBoolean, GraphQLFieldConfig, GraphQLString } from "graphql"
import { GraphQLInt, GraphQLObjectType } from "graphql"
import { ResolverContext } from "types/graphql"
import { PartnerOfferToCollectorType } from "../partnerOfferToCollector"
import { isFeatureFlagEnabled } from "lib/featureFlags"
import { date } from "../fields/date"

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

const AuctionCollectorSignals: GraphQLFieldConfig<any, ResolverContext> = {
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

    if (!activeLotData) {
      return null
    }

    // Resolve all associated auctions data in one object
    return {
      artwork,
      saleArtwork: activeLotData.saleArtwork,
      sale: activeLotData.sale,
    }
  },

  type: new GraphQLObjectType({
    name: "AuctionCollectorSignals",
    description: "Collector signals on a biddable auction lot",
    fields: {
      bidCount: {
        type: GraphQLInt,
        description: "Bid count",
        resolve: ({ saleArtwork }) => saleArtwork.bidder_positions_count,
      },
      lotWatcherCount: {
        type: GraphQLInt,
        description: "Lot watcher count",
        resolve: ({ artwork }) => artwork.recent_saves_count,
      },
      liveBiddingStarted: {
        type: GraphQLBoolean,
        description: "Live bidding has started on this lot's auction",
        resolve: ({ sale }) =>
          !!sale.live_start_at && new Date(sale.live_start_at) <= new Date(),
      },
      onlineBiddingExtended: {
        type: GraphQLBoolean,
        description: "Lot bidding period extended due to last-minute bids",
        resolve: ({ saleArtwork }) => !!saleArtwork.extended_bidding_end_at,
      },
      lotClosesAt: {
        ...date(
          ({ saleArtwork }) =>
            saleArtwork.extended_bidding_end_at || saleArtwork.end_at
        ),
        description: "Pending auction lot end time for bidding",
      },
      liveStartAt: {
        ...date(({ sale }) => sale.live_start_at),
        description: "Auction live bidding start time",
      },
      registrationEndsAt: {
        ...date(({ sale }) => sale.registration_ends_at),
        description: "Pending auction registration end time",
      },
    },
  }),
}

export const CollectorSignals: GraphQLFieldConfig<any, ResolverContext> = {
  type: new GraphQLObjectType({
    description: "Collector signals available to the artwork",
    name: "CollectorSignals",
    fields: {
      auction: AuctionCollectorSignals,
      bidCount: {
        type: GraphQLInt,
        description: "Bid count on lots open for bidding",
        deprecationReason: "Use nested field in `auction` instead",
      },
      lotWatcherCount: {
        type: GraphQLInt,
        description: "Lot watcher count on lots open for bidding",
        deprecationReason: "Use nested field in `auction` instead",
      },
      registrationEndsAt: {
        type: GraphQLString,
        description: "Pending auction registration end time",
        deprecationReason: "Use nested field in `auction` instead",
      },
      lotClosesAt: {
        type: GraphQLString,
        description: "Pending auction lot end time for bidding",
        deprecationReason: "Use nested field in `auction` instead",
      },
      onlineBiddingExtended: {
        type: GraphQLBoolean,
        description:
          "Auction lot bidding period extended due to last-minute bids",
        deprecationReason: "Use nested field in `auction` instead",
      },
      liveStartAt: {
        type: GraphQLString,
        description: "Auction live bidding start time",
        deprecationReason: "Use nested field in `auction` instead",
      },
      liveBiddingStarted: {
        type: GraphQLBoolean,
        description: "Live bidding has started on this lot's auction",
        deprecationReason: "Use nested field in `auction` instead",
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
