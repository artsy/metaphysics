import { ContextModule, OwnerType } from "@artsy/cohesion"
import { HomeViewSection } from "."
import { withHomeViewTimeout } from "../helpers/withHomeViewTimeout"
import { HomeViewSectionTypeNames } from "../sectionTypes/names"
import { artworksForUser } from "schema/v2/artworksForUser/artworksForUser"
import { shouldDisplayAuctionsHub } from "./AuctionsHub"

export const AuctionLotsForYou: HomeViewSection = {
  id: "home-view-section-auction-lots-for-you",
  type: HomeViewSectionTypeNames.HomeViewSectionArtworks,
  contextModule: ContextModule.lotsForYouRail,
  component: {
    title: "Your Auction Picks",
    behaviors: {
      viewAll: {
        buttonText: "Browse All Artworks",
      },
    },
  },
  ownerType: OwnerType.lotsByArtistsYouFollow,
  requiresAuthentication: true,
  shouldBeDisplayed: (context) => {
    return !shouldDisplayAuctionsHub(context)
  },

  resolver: withHomeViewTimeout(async (parent, args, context, info) => {
    const finalArgs = {
      // formerly specified client-side
      includeBackfill: !shouldDisplayAuctionsHub(context),
      onlyAtAuction: true,
      first: args.first,
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
