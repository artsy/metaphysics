import { ContextModule } from "@artsy/cohesion"
import { HomeViewSection } from "."
import { HomeViewSectionTypeNames } from "../sectionTypes/names"
import { connectionFromArray } from "graphql-relay"

const marketingColletionCategories = {
  Medium: {
    id: "Medium",
    title: "Medium",
    imageUrl:
      "https://files.artsy.net/images/collections-mediums-category.jpeg",
  },
  Movement: {
    id: "Movement",
    title: "Movement",
    imageUrl:
      "https://files.artsy.net/images/collections-movement-category.jpeg",
  },
  "Collect by Size": {
    id: "Collect by Size",
    title: "Size",
    imageUrl: "https://files.artsy.net/images/collections-size-category.jpeg",
  },
  "Collect by Color": {
    id: "Collect by Color",
    title: "Color",
    imageUrl: "https://files.artsy.net/images/collections-color-category.png",
  },
  "Collect by Price": {
    id: "Collect by Price",
    title: "Price",
    imageUrl: "https://files.artsy.net/images/collections-price-category.jpeg",
  },
  Gallery: {
    id: "Gallery",
    title: "Gallery",
    imageUrl:
      "https://files.artsy.net/images/collections-gallery-category.jpeg",
  },
}

export const ExploreByCategory: HomeViewSection = {
  id: "home-view-section-explore-by-category",
  featureFlag: "diamond_home-view-marketing-collection-categories",
  contextModule: ContextModule.exploreBySection,
  type: HomeViewSectionTypeNames.HomeViewSectionCards,
  component: {
    title: "Explore by Category",
  },
  requiresAuthentication: false,
  resolver: (_parent, args, _context, _info) => {
    const cards = Object.values(marketingColletionCategories).map(
      (category) => {
        return {
          ...category,
          entityID: category.id,
          entityType: "MarketingCollectionCategory",
          image_url: category.imageUrl,
        }
      }
    )

    return connectionFromArray(cards, args)
  },
}
