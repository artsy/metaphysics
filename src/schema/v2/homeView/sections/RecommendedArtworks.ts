import { ContextModule } from "@artsy/cohesion"
import { HomeViewSection } from "."
import { withHomeViewTimeout } from "../helpers/withHomeViewTimeout"
import { HomeViewSectionTypeNames } from "../HomeViewSection"
import { ArtworkRecommendations } from "schema/v2/me/artworkRecommendations"

export const RecommendedArtworks: HomeViewSection = {
  id: "home-view-section-recommended-artworks",
  type: HomeViewSectionTypeNames.HomeViewSectionArtworks,
  contextModule: ContextModule.recommendedArtistsRail,
  component: {
    title: "Artwork Recommendations",
    behaviors: {
      viewAll: {
        href: null,
        buttonText: "Browse All Artworks",
      },
    },
  },
  requiresAuthentication: true,

  resolver: withHomeViewTimeout(ArtworkRecommendations.resolve!),
}
