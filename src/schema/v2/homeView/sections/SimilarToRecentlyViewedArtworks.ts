import { ContextModule, OwnerType } from "@artsy/cohesion"
import { HomeViewSection } from "."
import { withHomeViewTimeout } from "../helpers/withHomeViewTimeout"
import { HomeViewSectionTypeNames } from "../HomeViewSection"
import { SimilarToRecentlyViewed } from "schema/v2/me/similarToRecentlyViewed"

export const SimilarToRecentlyViewedArtworks: HomeViewSection = {
  id: "home-view-section-similar-to-recently-viewed-artworks",
  type: HomeViewSectionTypeNames.HomeViewSectionArtworks,
  contextModule: ContextModule.similarToWorksYouViewedRail,
  component: {
    title: "Similar to Works You’ve Viewed",
    behaviors: {
      viewAll: {
        buttonText: "Browse All Artworks",
      },
    },
  },
  ownerType: OwnerType.similarToRecentlyViewed,
  requiresAuthentication: true,

  resolver: withHomeViewTimeout(async (parent, args, context, info) => {
    if (!context.meLoader) return []

    const { recently_viewed_artwork_ids } = await context.meLoader()

    if (recently_viewed_artwork_ids.length === 0) {
      return []
    }
    const recentlyViewedIds = recently_viewed_artwork_ids.slice(0, 7)

    return SimilarToRecentlyViewed.resolve!(
      { ...parent, recently_viewed_artwork_ids: recentlyViewedIds },
      args,
      context,
      info
    )
  }),
}
