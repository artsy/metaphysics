import { GraphQLObjectType } from "graphql"
import { ResolverContext } from "types/graphql"
import { HomeViewActivitySectionType } from "./Activity"
import { HomeViewArticlesSectionType } from "./Articles"
import { HomeViewArtistsSectionType } from "./Artists"
import { HomeViewArtworksSectionType } from "./Artworks"
import { HomeViewAuctionResultsSectionType } from "./AuctionResults"
import { HomeViewCardsSectionType } from "./Cards"
import { HomeViewDiscoverMarketingCollectionType } from "./DiscoverMarketingCollection"
import { HomeViewExploreBySectionType } from "./ExploreBy"
import { HomeViewFairsSectionType } from "./Fairs"
import { HomeViewGalleriesSectionType } from "./Galleries"
import { HomeViewHeroUnitsSectionType } from "./HeroUnits"
import { HomeViewMarketingCollectionsSectionType } from "./MarketingCollections"
import { HomeViewSalesSectionType } from "./Sales"
import { HomeViewShowsSectionType } from "./Shows"
import { HomeViewViewingRoomsSectionType } from "./ViewingRooms"

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
