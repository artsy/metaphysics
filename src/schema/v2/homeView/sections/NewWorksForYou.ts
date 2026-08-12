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
    type: "ArtworksGrid",
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
  // Deprecated: kept for clients that still read this field, but the
  // onyx_nwfy-artworks-card-test experiment is over, so it is always false.
  showArtworksCardView: () => false,
  resolver: withHomeViewTimeout(async (parent, args, context, info) => {
    const finalArgs = {
      // formerly specified client-side
      maxWorksPerArtist: 3,
      includeBackfill: true,
      first: args.first,
      version: "C",
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
