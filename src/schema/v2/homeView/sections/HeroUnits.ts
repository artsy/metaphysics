import { ContextModule } from "@artsy/cohesion"
import { HomeViewSection } from "."
import {
  HeroUnitsConnection,
  withFeaturedCityGuideHeroUnit,
} from "../helpers/withFeaturedCityGuideHeroUnit"
import { withHomeViewTimeout } from "../helpers/withHomeViewTimeout"
import { HomeViewSectionTypeNames } from "../sectionTypes/names"
import { heroUnitsConnection } from "schema/v2/HeroUnit/heroUnitsConnection"

export const HeroUnits: HomeViewSection = {
  id: "home-view-section-hero-units",
  type: HomeViewSectionTypeNames.HomeViewSectionHeroUnits,
  contextModule: ContextModule.heroUnitsRail,
  requiresAuthentication: false,

  resolver: withHomeViewTimeout(async (parent, args, context, info) => {
    const result = await heroUnitsConnection.resolve!(
      parent,
      args,
      context,
      info
    )

    return withFeaturedCityGuideHeroUnit(result as HeroUnitsConnection, args)
  }),
}
