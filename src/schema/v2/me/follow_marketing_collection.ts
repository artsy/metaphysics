import { GraphQLBoolean, GraphQLString } from "graphql"
import { mutationWithClientMutationId } from "graphql-relay"
import { ResolverContext } from "types/graphql"
import { MarketingCollectionType } from "../marketingCollections"

export const followMarketingCollection = mutationWithClientMutationId<
  any,
  any,
  ResolverContext
>({
  name: "FollowMarketingCollection",
  description: "Follow (or unfollow) a marketing collection",
  inputFields: {
    marketingCollectionID: { type: GraphQLString },
    unfollow: {
      type: GraphQLBoolean,
      defaultValue: false,
    },
  },
  outputFields: {
    marketingCollection: {
      type: MarketingCollectionType,
      resolve: (
        { marketing_collection },
        _options,
        { marketingCollectionLoader }
      ) => marketingCollectionLoader(marketing_collection.id),
    },
  },
  mutateAndGetPayload: (
    { marketingCollectionID, unfollow },
    { followMarketingCollectionLoader, unfollowMarketingCollectionLoader }
  ) => {
    if (
      !followMarketingCollectionLoader ||
      !unfollowMarketingCollectionLoader
    ) {
      throw new Error(
        "Missing Follow Marketing Collection Loader. Check your access token."
      )
    }

    const performAction = unfollow
      ? unfollowMarketingCollectionLoader(marketingCollectionID)
      : followMarketingCollectionLoader({
          marketing_collection_id: marketingCollectionID,
        })

    return performAction
  },
})
