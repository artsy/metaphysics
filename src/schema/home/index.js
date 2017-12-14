import HomePageArtworkModule from "./home_page_artwork_module"
import HomePageArtworkModules from "./home_page_artwork_modules"
import HomePageArtistModule from "./home_page_artist_module"
import HomePageArtistModules from "./home_page_artist_modules"
import HomePageHeroUnits from "./home_page_hero_units"
import HomePageFairsModule from "./home_page_fairs_module"

import { GraphQLObjectType } from "graphql"

const HomePageType = new GraphQLObjectType({
  name: "HomePage",
  fields: {
    artist_module: HomePageArtistModule,
    artist_modules: HomePageArtistModules,
    artwork_module: HomePageArtworkModule,
    artwork_modules: HomePageArtworkModules,
    hero_units: HomePageHeroUnits,
    fairs_module: HomePageFairsModule,
  },
})

const HomePage = {
  type: HomePageType,
  description: "Home screen content",
  resolve: () => {
    // dummy response object, otherwise the nested fields won’t work
    return {}
  },
}

export default HomePage
