import { GraphQLObjectType } from "graphql"
import { ResolverContext } from "types/graphql"
import { HomeViewArticlesSectionType } from "./sectionTypes/HomeViewArticlesSectionType"
import { HomeViewCardsSectionType } from "./sectionTypes/HomeViewCardsSectionType"
import { HomeViewDiscoverMarketingCollectionType } from "./sectionTypes/HomeViewDiscoverMarketingCollectionType"
import { HomeViewGalleriesSectionType } from "./sectionTypes/HomeViewGalleriesSectionType"
import { HomeViewSalesSectionType } from "./sectionTypes/HomeViewSalesSectionType"
import { HomeViewAuctionResultsSectionType } from "./sectionTypes/HomeViewAuctionResultsSectionType"
import { HomeViewActivitySectionType } from "./sectionTypes/HomeViewActivitySectionType"
import { HomeViewViewingRoomsSectionType } from "./sectionTypes/HomeViewViewingRoomsSectionType"
import { HomeViewShowsSectionType } from "./sectionTypes/HomeViewShowsSectionType"
import { HomeViewMarketingCollectionsSectionType } from "./sectionTypes/HomeViewMarketingCollectionsSectionType"
import { HomeViewExploreBySectionType } from "./sectionTypes/HomeViewExploreBySectionType"
import { HomeViewFairsSectionType } from "./sectionTypes/HomeViewFairsSectionType"
import { HomeViewHeroUnitsSectionType } from "./sectionTypes/HomeViewHeroUnitsSectionType"
import { HomeViewArtistsSectionType } from "./sectionTypes/HomeViewArtistsSectionType"
import { HomeViewArtworksSectionType } from "./sectionTypes/HomeViewArtworksSectionType"

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
