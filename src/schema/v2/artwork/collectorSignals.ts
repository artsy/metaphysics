import { GraphQLFieldConfig } from "graphql"
import { GraphQLInt, GraphQLObjectType } from "graphql"
import { ResolverContext } from "types/graphql"
import { PartnerOfferToCollectorType } from "../partnerOfferToCollector"

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
  description: "List of collector signals",

  resolve: async (artwork, {}, _ctx) => {
    return artwork.collectorSignals
  },
}
