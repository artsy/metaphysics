import { ContextModule } from "@artsy/cohesion"
import { HomeViewSection } from "."
import { withHomeViewTimeout } from "../helpers/withHomeViewTimeout"
import { HomeViewSectionTypeNames } from "../sectionTypes/names"
import { ArtistRecommendations } from "schema/v2/me/artistRecommendations"

export const RecommendedArtists: HomeViewSection = {
  id: "home-view-section-recommended-artists",
  type: HomeViewSectionTypeNames.HomeViewSectionArtists,
  contextModule: ContextModule.recommendedArtistsRail,
  component: {
    title: "Recommended Artists",
  },
  requiresAuthentication: true,

  resolver: withHomeViewTimeout(async (parent, args, context, info) => {
    return await ArtistRecommendations.resolve!(parent, args, context, info)
  }),
}
