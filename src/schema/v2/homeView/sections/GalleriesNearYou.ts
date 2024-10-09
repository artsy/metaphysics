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
    backgroundImageURL: "https://files.artsy.net/images/galleries_for_you.webp",
    behaviors: {
      viewAll: {
        buttonText: "Explore",
      },
    },
  },
  ownerType: OwnerType.galleriesForYou,
  requiresAuthentication: false,

  resolver: withHomeViewTimeout(async (_parent, _args, _context, _info) => {
    return {
      title: "Galleries Near You",
      subtitle: "Follow these local galleries for updates on artists you love.",
      href: "/galleries-for-you",
      image_url: "https://files.artsy.net/images/galleries_for_you.webp",
    }
  }),
}
