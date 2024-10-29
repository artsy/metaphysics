import { ContextModule, OwnerType } from "@artsy/cohesion"
import { HomeViewSection } from "."
import { HomeViewSectionTypeNames } from "../sectionTypes/names"
import { connectionFromArray } from "graphql-relay"
import marketingColletionCategories from "lib/marketingCollectionCategories"

export const ExploreByCategory: HomeViewSection = {
  id: "home-view-section-explore-by-category",
  featureFlag: "diamond_home-view-marketing-collection-categories",
  contextModule: ContextModule.exploreBy,
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
          entityType: OwnerType.collectionsCategory,
          image_url: category.imageUrl,
        }
      }
    )

    return connectionFromArray(cards, args)
  },
}
