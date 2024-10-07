import { ContextModule } from "@artsy/cohesion"
import { HomeViewSection } from "."
import { HomeViewSectionTypeNames } from "../HomeViewSection"
import { URL, URLSearchParams } from "url"
import { connectionFromArray } from "graphql-relay"

const marketingColletionCategories = {
  Medium: {
    id: "Medium",
    title: "Medium",
  },
  Movement: {
    id: "Movement",
    title: "Movement",
  },
  "Collect by Color": {
    id: "Collect by Color",
    title: "Color",
  },
  "Collect by Size": {
    id: "Collect by Size",
    title: "Size",
  },
  "Collect by Price": {
    id: "Collect by Price",
    title: "Price",
  },
  Gallery: {
    id: "Gallery",
    title: "Gallery",
  },
}

export const ExploreByCategory: HomeViewSection = {
  id: "home-view-section-explore-by-category",
  featureFlag: "diamond_home-view-marketing-collection-categories",
  contextModule: "" as ContextModule, // TODO: fill in with real value
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
          image_url: new URL(
            `/340x400/EEE/31343C?${new URLSearchParams({
              font: "open-sans",
              text: category.title,
            })}`,
            "https://placehold.co"
          ),
        }
      }
    )

    return connectionFromArray(cards, args)
  },
}
