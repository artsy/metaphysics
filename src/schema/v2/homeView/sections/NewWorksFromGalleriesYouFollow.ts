import { ContextModule } from "@artsy/cohesion"
import { HomeViewSection } from "."
import { withHomeViewTimeout } from "../helpers/withHomeViewTimeout"
import { HomeViewSectionTypeNames } from "../HomeViewSection"
import { newWorksFromGalleriesYouFollow } from "schema/v2/me/newWorksFromGalleriesYouFollow"

export const NewWorksFromGalleriesYouFollow: HomeViewSection = {
  id: "home-view-section-new-works-from-galleries-you-follow",
  type: HomeViewSectionTypeNames.HomeViewSectionArtworks,
  contextModule: ContextModule.newWorksByGalleriesYouFollowRail,
  component: {
    title: "New Works from Galleries You Follow",
    behaviors: {
      viewAll: {
        buttonText: "Browse All Artworks",
      },
    },
  },
  requiresAuthentication: true,

  resolver: withHomeViewTimeout(newWorksFromGalleriesYouFollow.resolve!),
}
