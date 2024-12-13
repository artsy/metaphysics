import { ContextModule, OwnerType } from "@artsy/cohesion"
import { HomeViewSection } from "."
import { withHomeViewTimeout } from "../helpers/withHomeViewTimeout"
import { HomeViewSectionTypeNames } from "../sectionTypes/names"
import { RecentlyViewedArtworks as _RecentlyViewedArtworks } from "../../me/recentlyViewedArtworks"

export const RecentlyViewedArtworks: HomeViewSection = {
  id: "home-view-section-recently-viewed-artworks",
  type: HomeViewSectionTypeNames.HomeViewSectionArtworks,
  contextModule: ContextModule.recentlyViewedRail,
  component: {
    title: "Recently Viewed",
    behaviors: {
      viewAll: {
        buttonText: "Browse All Artworks",
      },
    },
  },
  ownerType: OwnerType.recentlyViewed,

  resolver: withHomeViewTimeout(async (_parent, args, context, info) => {
    if (!context.accessToken || !context.meLoader) return null

    const me = await context.meLoader()

    return _RecentlyViewedArtworks.resolve!(me, args, context, info)
  }),
}
