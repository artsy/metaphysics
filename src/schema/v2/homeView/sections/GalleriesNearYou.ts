import { ContextModule, OwnerType } from "@artsy/cohesion"
import { HomeViewSection } from "."
import { HomeViewSectionTypeNames } from "../sectionTypes/names"
import { withHomeViewTimeout } from "../helpers/withHomeViewTimeout"

export const GalleriesNearYou: HomeViewSection = {
  id: "home-view-section-galleries-near-you",
  type: HomeViewSectionTypeNames.HomeViewSectionCard,
  contextModule: ContextModule.galleriesForYouBanner,
  component: {
    title: "Galleries Near You",
    description:
      "Follow these local galleries for updates on artists you love.",
  },
  ownerType: OwnerType.galleriesForYou,
  requiresAuthentication: false,

  resolver: withHomeViewTimeout(async (parent, _args, _context, _info) => {
    return {
      title: parent.component.title,
      subtitle: parent.component.description,
      href: "/galleries-for-you",
      buttonText: "Explore",
      image_url: "https://files.artsy.net/images/galleries_for_you.webp",
    }
  }),
}
