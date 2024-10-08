import { GraphQLObjectType } from "graphql"
import { ResolverContext } from "types/graphql"
import { HomeViewActivitySectionType } from "./HomeViewActivitySectionType"
import { HomeViewArticlesSectionType } from "./HomeViewArticlesSectionType"
import { HomeViewArtistsSectionType } from "./HomeViewArtistsSectionType"
import { HomeViewArtworksSectionType } from "./HomeViewArtworksSectionType"
import { HomeViewAuctionResultsSectionType } from "./HomeViewAuctionResultsSectionType"
import { HomeViewCardsSectionType } from "./HomeViewCardsSectionType"
import { HomeViewDiscoverMarketingCollectionType } from "./HomeViewDiscoverMarketingCollectionType"
import { HomeViewExploreBySectionType } from "./HomeViewExploreBySectionType"
import { HomeViewFairsSectionType } from "./HomeViewFairsSectionType"
import { HomeViewGalleriesSectionType } from "./HomeViewGalleriesSectionType"
import { HomeViewHeroUnitsSectionType } from "./HomeViewHeroUnitsSectionType"
import { HomeViewMarketingCollectionsSectionType } from "./HomeViewMarketingCollectionsSectionType"
import { HomeViewSalesSectionType } from "./HomeViewSalesSectionType"
import { HomeViewShowsSectionType } from "./HomeViewShowsSectionType"
import { HomeViewViewingRoomsSectionType } from "./HomeViewViewingRoomsSectionType"

export const homeViewSectionTypes: GraphQLObjectType<any, ResolverContext>[] = [
  HomeViewActivitySectionType,
  HomeViewArticlesSectionType,
  HomeViewArtistsSectionType,
  HomeViewArtworksSectionType,
  HomeViewAuctionResultsSectionType,
  HomeViewCardsSectionType,
  HomeViewDiscoverMarketingCollectionType,
  HomeViewExploreBySectionType,
  HomeViewFairsSectionType,
  HomeViewGalleriesSectionType,
  HomeViewHeroUnitsSectionType,
  HomeViewMarketingCollectionsSectionType,
  HomeViewSalesSectionType,
  HomeViewShowsSectionType,
  HomeViewViewingRoomsSectionType,
]
