import { ContextModule, OwnerType } from "@artsy/cohesion"
import { ArtworkRecommendations } from "schema/v2/me/artworkRecommendations"
import { withHomeViewTimeout } from "../helpers/withHomeViewTimeout"
import { HomeViewArtworksSection } from "../sectionTypes/Artworks"
import { HomeViewSectionTypeNames } from "../sectionTypes/names"

export const RecommendedArtworks: HomeViewArtworksSection = {
  id: "home-view-section-recommended-artworks",
  type: HomeViewSectionTypeNames.HomeViewSectionArtworks,
  contextModule: ContextModule.artworkRecommendationsRail,
  component: {
    title: "We Think You’ll Love",
    behaviors: {
      viewAll: {
        buttonText: "Browse All Artworks",
      },
    },
  },
  ownerType: OwnerType.artworkRecommendations,
  requiresAuthentication: true,
  trackItemImpressions: true,
  resolver: withHomeViewTimeout(ArtworkRecommendations.resolve!),
}
