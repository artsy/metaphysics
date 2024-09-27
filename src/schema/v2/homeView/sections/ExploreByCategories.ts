import { HomeViewSection } from "."
import { HomeViewSectionTypeNames } from "../HomeViewSection"

export const ExploreByCategories: HomeViewSection = {
  id: "home-view-section-explore-by-categories",
  type: HomeViewSectionTypeNames.HomeViewSectionMarketingCollectionCategories,
  component: {
    title: "Explore by categories",
  },
  requiresAuthentication: false,

  resolver: () => categories,
}

// TODO: temporary images, we still need to wait for the assets and to incorporate the image versions too
const categories = [
  {
    name: "Medium",
    image: {
      image_url: "https://files.artsy.net/images/capivara_chimarrao.jpg",
    },
    href: "/marketing-collections/Medium",
  },
  {
    name: "Movement",
    image: {
      image_url: "https://files.artsy.net/images/capivara_chimarrao.jpg",
    },
    // TODO: once the Movement MarketingCollectionCategory is available, we can use it here
    href: "/marketing-collections/Medium",
  },
  {
    name: "Color",
    image: {
      image_url: "https://files.artsy.net/images/capivara_boia.jpg",
    },
    href: "/marketing-collections/Collect by Color",
  },
  {
    name: "Size",
    image: {
      image_url: "https://files.artsy.net/images/capivara_nadando.jpg",
    },
    href: "/marketing-collections/Collect by Size",
  },
  {
    name: "Price",
    image: {
      image_url: "https://files.artsy.net/images/capivara_filhotes.jpg",
    },
    href: "/marketing-collections/Collect by Price",
  },
  {
    name: "Gallery",
    image: {
      image_url: "https://files.artsy.net/images/capivara_filhotes.jpg",
    },
    // TODO: once the Gallery MarketingCollectionCategory is available, we can use it here
    href: "/marketing-collections/Medium",
  },
]
