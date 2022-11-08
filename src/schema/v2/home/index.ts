import HomePageArtworkModule from "./home_page_artwork_module"
import HomePageArtworkModules from "./home_page_artwork_modules"
import HomePageArtistModule from "./home_page_artist_module"
import HomePageArtistModules from "./home_page_artist_modules"
import HomePageHeroUnits from "./home_page_hero_units"
import HomePageFairsModule from "./home_page_fairs_module"
import HomePageSalesModule from "./home_page_sales_module"
import HomePageMyCollectionOnboardingModule from "./home_page_my_collection_onboarding_module"

import { GraphQLObjectType, GraphQLFieldConfig } from "graphql"
import { ResolverContext } from "types/graphql"

const HomePageType = new GraphQLObjectType<any, ResolverContext>({
  name: "HomePage",
  fields: {
    artistModule: HomePageArtistModule,
    artistModules: HomePageArtistModules,
    artworkModule: HomePageArtworkModule,
    artworkModules: HomePageArtworkModules,
    heroUnits: HomePageHeroUnits,
    fairsModule: HomePageFairsModule,
    onboardingModule: HomePageMyCollectionOnboardingModule,
    salesModule: HomePageSalesModule,
  },
})

const HomePage: GraphQLFieldConfig<void, ResolverContext> = {
  type: HomePageType,
  description: "Home screen content",
  resolve: () => {
    // dummy response object, otherwise the nested fields won’t work
    return {}
  },
}

export default HomePage
