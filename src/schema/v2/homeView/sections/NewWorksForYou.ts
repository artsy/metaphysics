import { ContextModule } from "@artsy/cohesion"
import { HomeViewSection } from "."
import { withHomeViewTimeout } from "../helpers/withHomeViewTimeout"
import { HomeViewSectionTypeNames } from "../HomeViewSection"
import { artworksForUser } from "schema/v2/artworksForUser/artworksForUser"

export const NewWorksForYou: HomeViewSection = {
  id: "home-view-section-new-works-for-you",
  type: HomeViewSectionTypeNames.HomeViewSectionArtworks,
  contextModule: ContextModule.newWorksForYouRail,
  component: {
    title: "New works for you",
    behaviors: {
      viewAll: {
        href: null,
        buttonText: "Browse All Artworks",
      },
    },
  },
  requiresAuthentication: true,

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
