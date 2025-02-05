import { ContextModule, OwnerType } from "@artsy/cohesion"
import { HomeViewSection } from "."
import { HomeViewSectionTypeNames } from "../sectionTypes/names"
import { withHomeViewTimeout } from "../helpers/withHomeViewTimeout"
import type { HomeViewCard } from "../sectionTypes/Card"

export const GalleriesNearYou: HomeViewSection = {
  id: "home-view-section-galleries-near-you",
  type: HomeViewSectionTypeNames.HomeViewSectionCard,
  contextModule: ContextModule.galleriesForYouBanner,
  component: {
    title: "Galleries for You",
    description:
      "Follow these local galleries for updates on artists you love.",
  },
  ownerType: OwnerType.galleriesForYou,
  requiresAuthentication: false,

  resolver: withHomeViewTimeout(async (parent, _args, _context, _info) => {
    const card: HomeViewCard = {
      title: parent.component.title,
      subtitle: parent.component.description,
      buttonText: "Explore",
      image_url: "https://files.artsy.net/images/galleries_for_you.webp",
      entityType: "Page",
      entityID: parent.ownerType,
    }
    return card
  }),
}
