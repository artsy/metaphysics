import { ContextModule, OwnerType } from "@artsy/cohesion"
import { artworksForUser } from "schema/v2/artworksForUser/artworksForUser"
import { withHomeViewTimeout } from "../helpers/withHomeViewTimeout"
import { HomeViewArtworksSection } from "../sectionTypes/Artworks"
import { HomeViewSectionTypeNames } from "../sectionTypes/names"

export const NewWorksForYou: HomeViewArtworksSection = {
  id: "home-view-section-new-works-for-you",
  type: HomeViewSectionTypeNames.HomeViewSectionArtworks,
  contextModule: ContextModule.newWorksForYouRail,
  component: {
    title: "New Works for You",
    behaviors: {
      viewAll: {
        buttonText: "Browse All Artworks",
      },
    },
  },
  ownerType: OwnerType.newWorksForYou,
  requiresAuthentication: true,
  trackItemImpressions: true,
  resolver: withHomeViewTimeout(async (parent, args, context, info) => {
    const recommendationsVersion = "C"

    const finalArgs = {
      // formerly specified client-side
      maxWorksPerArtist: 3,
      includeBackfill: true,
      first: args.first,
      version: recommendationsVersion,
      excludeDislikedArtworks: true,
      excludeArtworkIds: [],

      ...args,
    }

    const result = await artworksForUser.resolve!(
      parent,
      finalArgs,
      context,
      info
    )

    return result
  }),
}
