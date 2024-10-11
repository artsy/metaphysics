import { GraphQLObjectType } from "graphql"
import { ResolverContext } from "types/graphql"
import { HomeViewActivitySectionType } from "./Activity"
import { HomeViewArticlesSectionType } from "./Articles"
import { HomeViewArtistsSectionType } from "./Artists"
import { HomeViewArtworksSectionType } from "./Artworks"
import { HomeViewAuctionResultsSectionType } from "./AuctionResults"
import { HomeViewCardSectionType } from "./Card"
import { HomeViewCardsSectionType } from "./Cards"
import { HomeViewFairsSectionType } from "./Fairs"
import { HomeViewHeroUnitsSectionType } from "./HeroUnits"
import { HomeViewMarketingCollectionsSectionType } from "./MarketingCollections"
import { HomeViewSalesSectionType } from "./Sales"
import { HomeViewShowsSectionType } from "./Shows"
import { HomeViewTasksSectionType } from "./Tasks"
import { HomeViewViewingRoomsSectionType } from "./ViewingRooms"

export const homeViewSectionTypes: GraphQLObjectType<any, ResolverContext>[] = [
  HomeViewActivitySectionType,
  HomeViewArticlesSectionType,
  HomeViewArtistsSectionType,
  HomeViewArtworksSectionType,
  HomeViewAuctionResultsSectionType,
  HomeViewCardSectionType,
  HomeViewCardsSectionType,
  HomeViewFairsSectionType,
  HomeViewHeroUnitsSectionType,
  HomeViewMarketingCollectionsSectionType,
  HomeViewSalesSectionType,
  HomeViewShowsSectionType,
  HomeViewTasksSectionType,
  HomeViewViewingRoomsSectionType,
]
