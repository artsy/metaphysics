import { GraphQLObjectType } from "graphql"
import { ResolverContext } from "types/graphql"
import {
  HomeViewActivitySectionType,
  HomeViewArticlesSectionType,
  HomeViewArtistsSectionType,
  HomeViewArtworksSectionType,
  HomeViewAuctionResultsSectionType,
  HomeViewCardsSectionType,
  HomeViewFairsSectionType,
  HomeViewGalleriesSectionType,
  HomeViewHeroUnitsSectionType,
  HomeViewExploreBySectionType,
  HomeViewMarketingCollectionsSectionType,
  HomeViewSalesSectionType,
  HomeViewShowsSectionType,
  HomeViewViewingRoomsSectionType,
  HomeViewDiscoverMarketingCollectionType,
} from "./HomeViewSection"

export const homeViewSectionTypes: GraphQLObjectType<any, ResolverContext>[] = [
  HomeViewActivitySectionType,
  HomeViewArticlesSectionType,
  HomeViewArtistsSectionType,
  HomeViewArtworksSectionType,
  HomeViewAuctionResultsSectionType,
  HomeViewCardsSectionType,
  HomeViewFairsSectionType,
  HomeViewGalleriesSectionType,
  HomeViewHeroUnitsSectionType,
  HomeViewExploreBySectionType,
  HomeViewMarketingCollectionsSectionType,
  HomeViewSalesSectionType,
  HomeViewShowsSectionType,
  HomeViewViewingRoomsSectionType,
  HomeViewDiscoverMarketingCollectionType,
]
