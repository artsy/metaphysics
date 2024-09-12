import {
  GraphQLBoolean,
  GraphQLEnumType,
  GraphQLFieldConfig,
  GraphQLString,
} from "graphql"
import { GraphQLInt, GraphQLObjectType } from "graphql"
import { ResolverContext } from "types/graphql"
import { PartnerOfferToCollectorType } from "../partnerOfferToCollector"
import { isFeatureFlagEnabled } from "lib/featureFlags"
import Show from "../show"
import { date } from "../fields/date"
import { GraphQLNonNull } from "graphql"

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

    const activeLotData = await getActiveAuctionValues(
      {
        artworkId: artwork.id,
        saleIds: artwork.sale_ids,
      },
      ctx
    )

    if (!activeLotData) {
      return null
    }

    const lotClosesAt =
      !activeLotData.sale.live_start_at &&
      (activeLotData.saleArtwork.extended_bidding_end_at ||
        activeLotData.saleArtwork.end_at ||
        activeLotData.sale.ended_at)
    const isBiddingClosed = lotClosesAt && new Date(lotClosesAt) <= new Date()

    // Resolve all associated auctions data in one object
    return {
      artwork,
      saleArtwork: activeLotData.saleArtwork,
      sale: activeLotData.sale,
      lotClosesAt,
      isBiddingClosed,
    }
  },

  type: new GraphQLObjectType({
    name: "AuctionCollectorSignals",
    description: "Collector signals on a biddable auction lot",
    fields: {
      bidCount: {
        type: new GraphQLNonNull(GraphQLInt),
        description: "Bid count",
        resolve: ({ saleArtwork }) => saleArtwork.bidder_positions_count ?? 0,
      },
      lotWatcherCount: {
        type: GraphQLInt,
        description: "Lot watcher count, null if lot is closed for bidding",
        resolve: ({ artwork, isBiddingClosed }) =>
          isBiddingClosed ? null : artwork.recent_saves_count,
      },
      liveBiddingStarted: {
        type: new GraphQLNonNull(GraphQLBoolean),
        description: "Live bidding has started on this lot's auction",
        resolve: ({ sale }) =>
          !!sale.live_start_at && new Date(sale.live_start_at) <= new Date(),
      },
      onlineBiddingExtended: {
        type: new GraphQLNonNull(GraphQLBoolean),
        description: "Lot bidding period extended due to last-minute bids",
        resolve: ({ saleArtwork }) => !!saleArtwork.extended_bidding_end_at,
      },
      lotClosesAt: {
        ...date(({ lotClosesAt }) => lotClosesAt),
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

const LabelSignalEnumType = new GraphQLEnumType({
  name: "LabelSignalEnum",
  values: {
    PARTNER_OFFER: { value: "PARTNER_OFFER" },
    INCREASED_INTEREST: { value: "INCREASED_INTEREST" },
    CURATORS_PICK: { value: "CURATORS_PICK" },
  },
})

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
      curatorsPick: {
        type: GraphQLBoolean,
        description:
          "Artwork is part of either the Curators' Pick Emerging or Blue Chip collections",
        resolve: (artwork, {}, ctx) => getIsCuratorsPick(artwork, ctx),
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
      primaryLabel: {
        type: LabelSignalEnumType,
        description: "Primary label signal available to collector",
        resolve: (artwork, {}, ctx) => getPrimaryLabel(artwork, ctx),
      },
      partnerOffer: {
        type: PartnerOfferToCollectorType,
        description: "Partner offer available to collector",
        resolve: (artwork, {}, ctx) => getActivePartnerOffer(artwork, ctx),
      },
      increasedInterest: {
        type: new GraphQLNonNull(GraphQLBoolean),
        description: "Increased interest in the artwork",
        resolve: (artwork) => !!artwork.increased_interest_signal,
      },
      runningShow: {
        type: Show.type,
        description:
          "Most recent running Show or Fair booth the artwork is currently in, sorted by relevance",
        resolve: async (artwork, {}, ctx) => {
          const showOrFair = await await ctx.relatedShowsLoader({
            artwork: [artwork._id],
            size: 1,
            status: "running",
            hasLocation: true,
            sort: "-relevance,-start_at",
          })
          return showOrFair.body[0]
        },
      },
    },
  }),
  description: "Collector signals on artwork",
  resolve: (artwork) => {
    const canSendSignals = artwork.purchasable || artwork.sale_ids?.length > 0
    return canSendSignals ? artwork : null
  },
}

type PrimaryLabel =
  | "PARTNER_OFFER"
  | "INCREASED_INTEREST"
  | "CURATORS_PICK"
  | null

// Single function to resolve mutually-exclusive label signals
const getPrimaryLabel = async (artwork, ctx): Promise<PrimaryLabel> => {
  const partnerOfferPromise = getActivePartnerOffer(artwork, ctx)
  const curatorsPickPromise = getIsCuratorsPick(artwork, ctx)

  const [activePartnerOffer, curatorsPick] = await Promise.all([
    partnerOfferPromise,
    curatorsPickPromise,
  ])

  if (activePartnerOffer) {
    return "PARTNER_OFFER"
  }
  if (artwork.increased_interest_signal) {
    return "INCREASED_INTEREST"
  }
  if (curatorsPick) {
    return "CURATORS_PICK"
  }

  return null
}

const checkFeatureFlag = (flag: any, context: any) => {
  const unleashContext = {
    userId: context.userID,
  }
  return isFeatureFlagEnabled(flag, unleashContext)
}

const getActivePartnerOffer = async (artwork, ctx) => {
  const partnerOfferEligible =
    checkFeatureFlag("emerald_signals-partner-offers", ctx) &&
    artwork.purchasable &&
    ctx.mePartnerOffersLoader
  if (!partnerOfferEligible) {
    return null
  }
  const partnerOffers = await ctx.mePartnerOffersLoader({
    artwork_id: artwork.id,
    sort: "-created_at",
    size: 1,
  })

  return partnerOffers.body?.find((po) => po.active)
}

const getIsCuratorsPick = async (artwork, ctx) => {
  const CURATED_COLLECTION_SLUGS = [
    "curators-picks-blue-chip-artists",
    "curators-picks-emerging-artists",
  ]

  const checks = await Promise.all(
    CURATED_COLLECTION_SLUGS.map(async (slug) => {
      const collection = await ctx.marketingCollectionLoader(slug)
      return collection.artwork_ids.includes(artwork._id)
    })
  )
  return checks.includes(true)
}

const getActiveAuctionValues = async (
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
      saleId: activeAuction._id,
      saleArtworkId: artworkId,
    })) ?? null

  return { saleArtwork, sale: activeAuction }
}
