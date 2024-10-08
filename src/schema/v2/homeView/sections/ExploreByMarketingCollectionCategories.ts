import { HomeViewSection } from "."
import { HomeViewSectionTypeNames } from "../HomeViewSectionTypeNames"

export const ExploreByMarketingCollectionCategories: HomeViewSection = {
  id: "home-view-section-explore-by-marketing-collection-categories",
  type:
    HomeViewSectionTypeNames.HomeViewSectionExploreByMarketingCollectionCategories,
  component: {
    title: "Explore by categories",
  },
  requiresAuthentication: false,
  featureFlag: "diamond_home-view-marketing-collection-categories",

  resolver: () => categories,
}

// TODO: temporary images, we still need to wait for the assets and to incorporate the image versions too
const categories = [
  {
    name: "Medium",
    image: {
      image_url: "https://files.artsy.net/images/capivara_chimarrao.jpg",
    },
    href: "/collections-by-category/Medium",
  },
  {
    name: "Movement",
    image: {
      image_url: "https://files.artsy.net/images/capivara_chimarrao.jpg",
    },
    // TODO: once the Movement MarketingCollectionCategory is available, we can use it here
    href: "/collections-by-category/Medium",
  },
  {
    name: "Color",
    image: {
      image_url: "https://files.artsy.net/images/capivara_boia.jpg",
    },
    href: "/collections-by-category/Collect by Color",
  },
  {
    name: "Size",
    image: {
      image_url: "https://files.artsy.net/images/capivara_nadando.jpg",
    },
    href: "/collections-by-category/Collect by Size",
  },
  {
    name: "Price",
    image: {
      image_url: "https://files.artsy.net/images/capivara_filhotes.jpg",
    },
    href: "/collections-by-category/Collect by Price",
  },
  {
    name: "Gallery",
    image: {
      image_url: "https://files.artsy.net/images/capivara_filhotes.jpg",
    },
    // TODO: once the Gallery MarketingCollectionCategory is available, we can use it here
    href: "/collections-by-category/Medium",
  },
]
