import { ContextModule, OwnerType } from "@artsy/cohesion"
import { HomeViewSection } from "."
import { HomeViewSectionTypeNames } from "../sectionTypes/names"
import { connectionFromArray } from "graphql-relay"
import { discoveryCategories } from "lib/discoveryCategories"

const orderedCategoryKeys = [
  "Medium",
  "Movement",
  "Collect by Size",
  "Collect by Color",
  "Collect by Price",
  "Gallery",
]

export const ExploreByCategory: HomeViewSection = {
  id: "home-view-section-explore-by-category",
  contextModule: ContextModule.exploreBy,
  type: HomeViewSectionTypeNames.HomeViewSectionCards,
  component: {
    title: "Explore by Category",
  },
  requiresAuthentication: false,
  maximumEigenVersion: { major: 8, minor: 77, patch: 0 },
  resolver: (_parent, args, _context, _info) => {
    const cards = orderedCategoryKeys.map((key) => {
      const category = discoveryCategories[key]

      return {
        entityID: category.id,
        entityType: OwnerType.collectionsCategory,
        imageURL: category.imageUrl,
        title: category.title,
      }
    })

    return connectionFromArray(cards, args)
  },
}
