import { ContextModule, OwnerType } from "@artsy/cohesion"
import { HomeViewSectionTypeNames } from "../sectionTypes/names"
import { withHomeViewTimeout } from "../helpers/withHomeViewTimeout"
import { HomeViewArtworksSection } from "../sectionTypes/Artworks"
import { BasedOnUserSaves } from "schema/v2/basedOnUserSaves/basedOnUserSaves"

const TIMEOUT_MS = 6000

export const BasedOnYourRecentSaves: HomeViewArtworksSection = {
  id: "home-view-section-based-on-your-recent-saves",
  type: HomeViewSectionTypeNames.HomeViewSectionArtworks,
  contextModule: ContextModule.basedOnYourRecentSavesRail,
  component: {
    title: "Inspired by Your Saved Artworks",
  },
  ownerType: OwnerType.basedOnYourRecentSaves,
  requiresAuthentication: true,
  trackItemImpressions: true,
  resolver: withHomeViewTimeout(async (parent, args, context, info) => {
    return await BasedOnUserSaves.resolve!(parent, args, context, info)
  }, TIMEOUT_MS),
}
