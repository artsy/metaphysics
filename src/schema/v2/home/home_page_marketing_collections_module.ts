import {
  MarketingCollectionType,
  fetchMarketingCollections,
} from "schema/v2/marketingCollections"
import { GraphQLList, GraphQLObjectType, GraphQLNonNull } from "graphql"
import { ResolverContext } from "types/graphql"

export const HomePageMarketingModuleType = new GraphQLObjectType<
  any,
  ResolverContext
>({
  name: "HomePageMarketingModule",
  fields: {
    results: {
      type: new GraphQLNonNull(new GraphQLList(MarketingCollectionType)),
      resolve: async (_root, _options, { marketingCollectionsLoader }) => {
        if (!marketingCollectionsLoader) return []
        const slugs = [
          "trending-now",
          "top-auction-lots",
          "new-this-week",
          "curators-picks-blue-chip",
          "finds-under-1000-dollars",
          "best-of-prints-and-editions",
        ]

        return await fetchMarketingCollections(
          { slugs },
          marketingCollectionsLoader
        )
      },
    },
  },
})

const HomePageMarketingModule = {
  type: HomePageMarketingModuleType,
  resolve: (_root, obj) => obj,
}

export default HomePageMarketingModule
