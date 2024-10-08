import { ContextModule } from "@artsy/cohesion"
import { HomeViewSection } from "."
import { HomeViewSectionTypeNames } from "../sectionTypes/names"
import { connectionFromArray } from "graphql-relay"

// TODO: replace placeholder images 🐹
const marketingColletionCategories = {
  Medium: {
    id: "Medium",
    title: "Medium",
    imageUrl: "https://files.artsy.net/images/capivara_chimarrao.jpg",
  },
  Movement: {
    id: "Movement",
    title: "Movement",
    imageUrl: "https://files.artsy.net/images/capivara_chimarrao.jpg",
  },
  "Collect by Color": {
    id: "Collect by Color",
    title: "Color",
    imageUrl: "https://files.artsy.net/images/capivara_boia.jpg",
  },
  "Collect by Size": {
    id: "Collect by Size",
    title: "Size",
    imageUrl: "https://files.artsy.net/images/capivara_nadando.jpg",
  },
  "Collect by Price": {
    id: "Collect by Price",
    title: "Price",
    imageUrl: "https://files.artsy.net/images/capivara_filhotes.jpg",
  },
  Gallery: {
    id: "Gallery",
    title: "Gallery",
    imageUrl: "https://files.artsy.net/images/capivara_filhotes.jpg",
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
          image_url: category.imageUrl,
        }
      }
    )

    return connectionFromArray(cards, args)
  },
}
