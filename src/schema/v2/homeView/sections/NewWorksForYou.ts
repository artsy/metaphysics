import { ContextModule, OwnerType } from "@artsy/cohesion"
import { HomeViewSection } from "."
import { withHomeViewTimeout } from "../helpers/withHomeViewTimeout"
import { HomeViewSectionTypeNames } from "../sectionTypes/names"
import { artworksForUser } from "schema/v2/artworksForUser/artworksForUser"
import { getExperimentVariant } from "lib/featureFlags"

export const NewWorksForYou: HomeViewSection = {
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

  resolver: withHomeViewTimeout(async (parent, args, context, info) => {
    const variant = getExperimentVariant("onyx_nwfy-price-affinity-test", {
      userId: context.userID,
    })

    let recommendationsVersion = "C"

    if (variant && variant.enabled && variant.name === "experiment") {
      recommendationsVersion = "A"
    }

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
