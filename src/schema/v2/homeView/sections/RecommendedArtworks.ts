import { ContextModule, OwnerType } from "@artsy/cohesion"
import { HomeViewSection } from "."
import { withHomeViewTimeout } from "../helpers/withHomeViewTimeout"
import { HomeViewSectionTypeNames } from "../sectionTypes/names"
import { ArtworkRecommendations } from "schema/v2/me/artworkRecommendations"

export const RecommendedArtworks: HomeViewSection = {
  id: "home-view-section-recommended-artworks",
  type: HomeViewSectionTypeNames.HomeViewSectionArtworks,
  contextModule: ContextModule.artworkRecommendationsRail,
  component: {
    title: "Artwork Recommendations",
    behaviors: {
      viewAll: {
        buttonText: "Browse All Artworks",
      },
    },
  },
  ownerType: OwnerType.artworkRecommendations,
  requiresAuthentication: true,

  resolver: withHomeViewTimeout(ArtworkRecommendations.resolve!),
}
