import { ContextModule, OwnerType } from "@artsy/cohesion"
import { HomeViewSection } from "."
import { withHomeViewTimeout } from "../helpers/withHomeViewTimeout"
import { HomeViewCard } from "../sectionTypes/Card"
import { HomeViewSectionTypeNames } from "../sectionTypes/names"

export const InfiniteDiscovery: HomeViewSection = {
  contextModule: ContextModule.infiniteDiscoveryBanner,
  featureFlag: "diamond_home-view-infinite-discovery",
  id: "home-view-section-infinite-discovery",
  requiresAuthentication: true,
  ownerType: OwnerType.infiniteDiscovery,
  type: HomeViewSectionTypeNames.HomeViewSectionCard,

  resolver: withHomeViewTimeout(async (parent, _args, _context, _info) => {
    const card: HomeViewCard = {
      title: "Discover art, tailored to you",
      subtitle:
        "Our new feature learns your unique tastes as you explore, delivering personalized recommendations effortlessly.",
      buttonText: "Explore Art",
      image_url: "https://files.artsy.net/images/infinite_discovery.png",
      entityType: "Page",
      entityID: parent.ownerType,
    }
    return card
  }),
}