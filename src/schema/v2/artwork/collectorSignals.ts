import { GraphQLUnionType, GraphQLFieldConfig } from "graphql"
import {
  GraphQLEnumType,
  GraphQLInt,
  GraphQLInterfaceType,
  GraphQLNonNull,
  GraphQLObjectType,
} from "graphql"
import { ResolverContext } from "types/graphql"
import { PartnerOfferToCollectorType } from "../partnerOfferToCollector"

enum CollectorSignalTypes {
  BID_COUNT = "bid_count",
  LOT_WATCHER_COUNT = "lot_watcher_count",
}

const CollectorSignalTypeEnum = new GraphQLEnumType({
  name: "CollectorSignalType",
  values: {
    BID_COUNT: { value: CollectorSignalTypes.BID_COUNT },
    LOT_WATCHER_COUNT: { value: CollectorSignalTypes.LOT_WATCHER_COUNT },
  },
})

const CollectorSignalInterface = new GraphQLInterfaceType({
  name: "CollectorSignalInterface",
  fields: () => ({
    type: {
      type: new GraphQLNonNull(CollectorSignalTypeEnum),
    },
  }),
})

// const collectorSignalsMembers: Record<CollectorSignalTypes, GraphQLObjectType> = {
//   [CollectorSignalTypes.BID_COUNT]: new GraphQLObjectType({
//     name: "BidCountCollectorSignal",
//     interfaces: [CollectorSignalInterface],
//     fields: {
//       type: {
//         type: new GraphQLNonNull(CollectorSignalTypeEnum),
//       },
//       count: {
//         type: new GraphQLNonNull(GraphQLInt),
//       },
//     },
//   }),
//   [CollectorSignalTypes.LOT_WATCHER_COUNT]: new GraphQLObjectType({
//     name: "LotWatcherCountCollectorSignal",
//     interfaces: [CollectorSignalInterface],
//     fields: {
//       type: {
//         type: new GraphQLNonNull(CollectorSignalTypeEnum),
//       },
//       count: {
//         type: new GraphQLNonNull(GraphQLInt),
//       },
//     },
//   }),
// }

const LotWatcherCountCollectorSignalType = new GraphQLObjectType({
  name: "LotWatcherCollectorSignal",
  interfaces: [CollectorSignalInterface],
  fields: {
    type: {
      type: new GraphQLNonNull(CollectorSignalTypeEnum),
    },
    count: {
      type: new GraphQLNonNull(GraphQLInt),
      resolve: ({ recent_saves_count }) => recent_saves_count,
    },
  },
})
const BidCountCollectorSignalType = new GraphQLObjectType({
  name: "BidCountCollectorSignal",
  interfaces: [CollectorSignalInterface],
  fields: {
    type: {
      type: new GraphQLNonNull(CollectorSignalTypeEnum),
    },
    count: {
      type: new GraphQLNonNull(GraphQLInt),
    },
  },
})

// eslint-disable-next-line @typescript-eslint/no-unused-vars
const CollectorSignalUnionType = new GraphQLUnionType({
  name: "CollectorSignalUnion",
  types: [LotWatcherCountCollectorSignalType, BidCountCollectorSignalType],
  resolveType: (data) => {
    switch (data.type) {
      case "lot_watcher_count":
        return LotWatcherCountCollectorSignalType
      case "bid_count":
        return BidCountCollectorSignalType
    }
  },
})

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
  recentSavesCount?: number
  partnerOffer?: { endAt: string }
}

export const enrichArtworkWithCollectorSignals = async (artwork, ctx) => {
  const enrichedSignals: EnrichedSignals = {}
  artwork.collectorSignals = enrichedSignals

  const artworkId = artwork._id

  // Is this an auction artwork?
  const inSale = artwork.sale_ids?.length > 0

  if (inSale) {
    const activeAuctions = await activeAuctionsForArtwork(artwork, ctx)
    const activeAuction = activeAuctions[0]

    if (activeAuction) {
      const saleArtworkRequest = ctx.saleArtworkLoader({
        saleId: activeAuction.id, // _id?
        saleArtworkId: artworkId,
      })
      const [activeSaleArtwork] = await Promise.all([saleArtworkRequest])

      // }
      if (activeSaleArtwork) {
        enrichedSignals.bidCount = activeSaleArtwork.bidder_positions_count
      }
    }

    // handle signals for non-auction acquirable artworks
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
