import { GraphQLFieldConfig, GraphQLEnumType } from "graphql"
import { ResolverContext } from "types/graphql"

export const AuctionSegmentationType = new GraphQLEnumType({
  name: "AuctionSegmentationType",
  description: "Classification of users based on auction activity",
  values: {
    NEW: {
      value: "new",
      description: "Users with recently created accounts",
    },
    ADJACENT: {
      value: "adjacent",
      description: "Users with recent auction-related activity",
    },
    ENGAGED: {
      value: "engaged",
      description: "Users with a recent auction registration",
    },
    DISENGAGED: {
      value: "disengaged",
      description: "Users who have not engaged with auctions recently",
    },
  },
})

export const AuctionSegmentation: GraphQLFieldConfig<void, ResolverContext> = {
  type: AuctionSegmentationType,
  description:
    "Classification of the user based on their auction-related activity",
  resolve: async (_parent, _args, context, _info) => {
    const { auctionUserSegmentationLoader } = context
    const vortexResponse = await auctionUserSegmentationLoader?.()
    return vortexResponse?.data?.[0]?.auction_segmentation
  },
}
